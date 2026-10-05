import type Stripe from 'stripe'
import { Prisma } from '../../generated/prisma/client.js'
import type {
  UserModel as User,
  ProductModel as Product,
  UserLibraryModel as UserLibrary,
} from '../../generated/prisma/models.js'
import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { productsRepo } from '../products/products.repo.js'
import type { CheckoutSessionDto } from './billing.schema.js'
import { stripeService } from './stripe.service.js'
import { stripe } from './stripe.js'

type NoticeEndpoint =
  | 'subscription-started'
  | 'cancel-subscription'
  | 'delete-subscription'
  | 'payment-attempt-failed'

type Notice = {
  endpoint: NoticeEndpoint
  body: { to: string; productName: string; userName: string; locale: string }
}

interface BillingContext {
  tx: Prisma.TransactionClient
  event: Stripe.Event
  subscriptionId: string
  subscription: Stripe.Subscription
  existing: UserLibrary | null
  userId: string
  productId: string
  user: User
  product: Product
  now: Date
  terminal: boolean
  scheduledCancellation: boolean
}

const objectId = (
  value: string | { id: string } | null | undefined
): string | null => (typeof value === 'string' ? value : (value?.id ?? null))

const subscriptionOf = (event: Stripe.Event): string | null => {
  if (event.type.startsWith('customer.subscription.')) {
    return (event.data.object as Stripe.Subscription).id
  }

  if (event.type.startsWith('checkout.session.')) {
    return objectId((event.data.object as Stripe.Checkout.Session).subscription)
  }

  const invoice = event.data.object as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
  }

  return objectId(
    invoice.parent?.subscription_details?.subscription ?? invoice.subscription
  )
}

const handled = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

const isUnpaidCheckout = (event: Stripe.Event): boolean => {
  if (!event.type.startsWith('checkout.session.')) return false

  const session = event.data.object as Stripe.Checkout.Session
  return (
    session.payment_status !== 'paid' &&
    session.payment_status !== 'no_payment_required'
  )
}

const calculatePaidUntil = (
  event: Stripe.Event,
  subscription: Stripe.Subscription,
  subscriptionId: string
): Date => {
  const ends = (
    event.type === 'invoice.paid'
      ? (event.data.object as Stripe.Invoice).lines.data
          .filter(
            (line) =>
              objectId(
                line.parent?.subscription_item_details?.subscription ??
                  line.subscription
              ) === subscriptionId
          )
          .map((line) => line.period.end)
      : subscription.items.data.map((item) => item.current_period_end)
  ).filter((end) => Number.isFinite(end) && end > 0)

  if (ends.length === 0) {
    throw ApiError(
      502,
      'BILLING_PERIOD_MISSING',
      'Subscription has no billing period'
    )
  }

  return new Date(Math.max(...ends) * 1000)
}

const buildBillingContext = async (
  tx: Prisma.TransactionClient,
  event: Stripe.Event,
  subscriptionId: string
): Promise<BillingContext | null> => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const existing = await tx.userLibrary.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  const checkoutMetadata = event.type.startsWith('checkout.session.')
    ? (event.data.object as Stripe.Checkout.Session).metadata
    : null

  const userId =
    subscription.metadata.userId ?? checkoutMetadata?.userId ?? existing?.userId

  const productId =
    subscription.metadata.productId ??
    checkoutMetadata?.productId ??
    existing?.productId

  // Other subscriptions on the same Stripe account do not belong to this application.
  if (!userId || !productId) return null

  const [user, product] = await Promise.all([
    tx.user.findUnique({ where: { id: userId } }),
    tx.product.findUnique({ where: { id: productId } }),
  ])

  if (!user || !product) {
    throw ApiError(
      409,
      'BILLING_REFERENCE_MISSING',
      'Subscription references an unknown user or product'
    )
  }

  if (
    existing &&
    (existing.userId !== userId || existing.productId !== productId)
  ) {
    throw ApiError(
      409,
      'BILLING_REFERENCE_MISMATCH',
      'Subscription ownership does not match'
    )
  }

  const now = new Date()
  const terminal = [
    'canceled',
    'unpaid',
    'incomplete_expired',
    'paused',
  ].includes(subscription.status)

  const scheduledCancellation =
    subscription.cancel_at_period_end || subscription.cancel_at != null

  return {
    tx,
    event,
    subscriptionId,
    subscription,
    existing,
    userId,
    productId,
    user,
    product,
    now,
    terminal,
    scheduledCancellation,
  }
}

// Webhook event dispatcher
const dispatchWebhook = async (
  ctx: BillingContext
): Promise<NoticeEndpoint | undefined> => {
  if (ctx.event.type === 'invoice.payment_failed') {
    return billingService.handlePaymentFailed(ctx)
  }

  if (ctx.terminal) {
    return billingService.handleSubscriptionTerminated(ctx)
  }

  if (
    ctx.event.type === 'invoice.paid' ||
    ctx.event.type.startsWith('checkout.session.')
  ) {
    return billingService.handlePaymentSuccess(ctx)
  }

  return billingService.handleSubscriptionUpdated(ctx)
}

const saveBillingNotice = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  endpoint: NoticeEndpoint,
  user: User,
  product: Product
): Promise<void> => {
  const notice: Notice = {
    endpoint,
    body: {
      to: user.email,
      userName: user.name,
      productName: product.name,
      locale: user.locale,
    },
  }

  await tx.billingEvent.update({
    where: { id: eventId },
    data: { notification: notice as unknown as Prisma.InputJsonValue },
  })
}

// Delivery is retried on Stripe redelivery. Resend also receives a stable idempotency key.
const deliverNotification = async (eventId: string): Promise<void> => {
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "BillingEvent" WHERE "id" = ${eventId} FOR UPDATE`

      const record = await tx.billingEvent.findUnique({
        where: { id: eventId },
      })

      if (!record?.notification || record.notificationSentAt) return

      const notice = record.notification as unknown as Notice
      const base = process.env.NOTIFICATIONS_SERVICE_URL
      const secret = process.env.NOTIFICATIONS_SERVICE_SECRET

      if (!base || !secret) {
        throw ApiError(
          503,
          'NOTIFICATIONS_UNAVAILABLE',
          'Notifications are not configured'
        )
      }

      const response = await fetch(
        `${base.replace(/\/$/, '')}/api/email/${notice.endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            service_token: secret,
            'idempotency-key': eventId,
          },
          body: JSON.stringify(notice.body),
          signal: AbortSignal.timeout(10_000),
        }
      )

      if (!response.ok) {
        throw ApiError(
          502,
          'NOTIFICATION_FAILED',
          'Notification delivery failed'
        )
      }

      await tx.billingEvent.update({
        where: { id: eventId },
        data: { notificationSentAt: new Date() },
      })
    },
    { maxWait: 15_000, timeout: 20_000 }
  )
}

export const billingService = {
  createCheckoutSession: async (
    user: TokenPayload,
    data: CheckoutSessionDto
  ) => {
    const product = await productsRepo.findById(data.productId)

    if (!product || product.archivedAt) {
      throw ApiError(404, 'NOT_FOUND', 'Product not found')
    }

    if (!product.stripePriceId) {
      throw ApiError(
        409,
        'NOT_PURCHASABLE',
        'This product cannot be purchased yet'
      )
    }

    const url = await stripeService.getStripeCheckoutUrl(
      product,
      { userId: user.id, productId: product.id },
      data.locale
    )

    return { response: { url } }
  },

  handleWebhookEvent: async (event: Stripe.Event): Promise<void> => {
    if (!handled.has(event.type)) return

    if (await prisma.billingEvent.findUnique({ where: { id: event.id } })) {
      await deliverNotification(event.id)
      return
    }

    const subscriptionId = subscriptionOf(event)
    if (!subscriptionId) return

    if (isUnpaidCheckout(event)) return

    await prisma.$transaction(
      async (tx) => {
        // Serialize events for a subscription and reconcile with its current Stripe state,
        // rather than letting a late invoice resurrect a deleted subscription.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${subscriptionId}, 0))`

        const claimed = await tx.billingEvent.createMany({
          data: { id: event.id },
          skipDuplicates: true,
        })
        if (claimed.count === 0) return

        const ctx = await buildBillingContext(tx, event, subscriptionId)
        if (!ctx) return

        const endpoint = await dispatchWebhook(ctx)
        if (endpoint) {
          await saveBillingNotice(tx, event.id, endpoint, ctx.user, ctx.product)
        }
      },
      { maxWait: 15_000, timeout: 60_000 }
    )

    await deliverNotification(event.id)
  },

  // 1. Failed payment attempt
  handlePaymentFailed: async (ctx: BillingContext): Promise<NoticeEndpoint> => {
    return 'payment-attempt-failed'
  },

  // 2. Subscription terminated / revoked (terminal statuses: canceled, unpaid, paused, etc.)
  handleSubscriptionTerminated: async (
    ctx: BillingContext
  ): Promise<NoticeEndpoint | undefined> => {
    const { tx, existing, event, now } = ctx
    if (!existing) return

    await tx.userLibrary.update({
      where: { id: existing.id },
      data: {
        canceledAt: existing.canceledAt ?? now,
        accessExpiresAt:
          existing.accessExpiresAt && existing.accessExpiresAt < now
            ? existing.accessExpiresAt
            : now,
      },
    })

    if (event.type === 'customer.subscription.deleted') {
      return 'delete-subscription'
    }
  },

  // 3. Successful payment (checkout session or paid invoice)
  handlePaymentSuccess: async (
    ctx: BillingContext
  ): Promise<NoticeEndpoint | undefined> => {
    const {
      tx,
      event,
      subscription,
      subscriptionId,
      userId,
      productId,
      existing,
      scheduledCancellation,
      now,
    } = ctx

    const paidUntil = calculatePaidUntil(event, subscription, subscriptionId)
    const accessExpiresAt =
      existing?.accessExpiresAt && existing.accessExpiresAt > paidUntil
        ? existing.accessExpiresAt
        : paidUntil

    const canceledAt = scheduledCancellation
      ? (existing?.canceledAt ?? now)
      : null

    await tx.userLibrary.upsert({
      where: { stripeSubscriptionId: subscriptionId },
      create: {
        userId,
        productId,
        stripeSubscriptionId: subscriptionId,
        subscriptionId,
        accessExpiresAt,
        canceledAt,
      },
      update: { accessExpiresAt, canceledAt },
    })

    if (!existing) {
      return 'subscription-started'
    }
  },

  // 4. Subscription updated (e.g. scheduled cancellation at period end)
  handleSubscriptionUpdated: async (
    ctx: BillingContext
  ): Promise<NoticeEndpoint | undefined> => {
    const { tx, existing, scheduledCancellation, now } = ctx
    if (!existing) return

    // A renewal becomes accessible only after payment, not on subscription.updated.
    await tx.userLibrary.update({
      where: { id: existing.id },
      data: {
        canceledAt: scheduledCancellation ? (existing.canceledAt ?? now) : null,
      },
    })

    if (scheduledCancellation && !existing.canceledAt) {
      return 'cancel-subscription'
    }
  },
}
