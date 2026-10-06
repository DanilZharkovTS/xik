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
import { libraryRepo } from '../library/library.repo.js'

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
    console.error(
      `[BillingWebhook] No billing period end found for subscription ${subscriptionId} in event ${event.id}`
    )
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
  if (!userId || !productId) {
    console.warn(
      `[BillingWebhook] Subscription ${subscriptionId} lacks application metadata (userId: ${userId}, productId: ${productId}), skipping`
    )
    return null
  }

  const [user, product] = await Promise.all([
    tx.user.findUnique({ where: { id: userId } }),
    tx.product.findUnique({ where: { id: productId } }),
  ])

  if (!user || !product) {
    console.error(
      `[BillingWebhook] Reference missing for subscription ${subscriptionId}: user=${Boolean(user)} (id: ${userId}), product=${Boolean(product)} (id: ${productId})`
    )
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
    console.error(
      `[BillingWebhook] Ownership mismatch for subscription ${subscriptionId}: existing=(userId: ${existing.userId}, productId: ${existing.productId}) vs incoming=(userId: ${userId}, productId: ${productId})`
    )
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

  console.log(
    `[BillingWebhook] Context built for subscription ${subscriptionId}: user=${user.email}, product=${product.name}, status=${subscription.status}, terminal=${terminal}, scheduledCancellation=${scheduledCancellation}`
  )

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
  console.log(
    `[BillingWebhook] Dispatching event ${ctx.event.id} (${ctx.event.type}) for subscription ${ctx.subscriptionId}`
  )

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
  console.log(
    `[BillingWebhook] Scheduling notice '${endpoint}' for event ${eventId} (recipient: ${user.email})`
  )

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

      if (!record?.notification) {
        console.log(
          `[BillingWebhook] No notification payload found for event ${eventId}, skipping delivery`
        )
        return
      }

      if (record.notificationSentAt) {
        console.log(
          `[BillingWebhook] Notification for event ${eventId} was already sent at ${record.notificationSentAt.toISOString()}, skipping delivery`
        )
        return
      }

      const notice = record.notification as unknown as Notice
      const base = process.env.NOTIFICATIONS_SERVICE_URL
      const secret = process.env.NOTIFICATIONS_SERVICE_SECRET

      if (!base || !secret) {
        console.error(
          `[BillingWebhook] Notifications service credentials not configured (url: ${Boolean(base)}, secret: ${Boolean(secret)})`
        )
        throw ApiError(
          503,
          'NOTIFICATIONS_UNAVAILABLE',
          'Notifications are not configured'
        )
      }

      console.log(
        `[BillingWebhook] Delivering notification '${notice.endpoint}' to ${notice.body.to} for event ${eventId}...`
      )

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
        console.error(
          `[BillingWebhook] Notification request failed with status ${response.status} for event ${eventId}`
        )
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

      console.log(
        `[BillingWebhook] Notification '${notice.endpoint}' delivered successfully for event ${eventId}`
      )
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
    console.log(
      `[BillingWebhook] Received event: ${event.type} (id: ${event.id})`
    )

    if (!handled.has(event.type)) {
      console.log(
        `[BillingWebhook] Event type '${event.type}' is not handled, skipping (id: ${event.id})`
      )
      return
    }

    if (await prisma.billingEvent.findUnique({ where: { id: event.id } })) {
      console.log(
        `[BillingWebhook] Event ${event.id} already exists in database; retrying pending notification delivery`
      )
      await deliverNotification(event.id)
      return
    }

    const subscriptionId = subscriptionOf(event)
    if (!subscriptionId) {
      console.warn(
        `[BillingWebhook] No subscription ID found in event ${event.id} (${event.type}), skipping`
      )
      return
    }

    if (isUnpaidCheckout(event)) {
      console.log(
        `[BillingWebhook] Checkout session for event ${event.id} is unpaid, skipping`
      )
      return
    }

    await prisma.$transaction(
      async (tx) => {
        // Serialize events for a subscription and reconcile with its current Stripe state,
        // rather than letting a late invoice resurrect a deleted subscription.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${subscriptionId}, 0))`

        const claimed = await tx.billingEvent.createMany({
          data: { id: event.id },
          skipDuplicates: true,
        })
        if (claimed.count === 0) {
          console.log(
            `[BillingWebhook] Event ${event.id} was claimed concurrently by another transaction, skipping`
          )
          return
        }

        const ctx = await buildBillingContext(tx, event, subscriptionId)
        if (!ctx) {
          console.warn(
            `[BillingWebhook] Could not build billing context for event ${event.id}, skipping`
          )
          return
        }

        const endpoint = await dispatchWebhook(ctx)
        if (endpoint) {
          await saveBillingNotice(tx, event.id, endpoint, ctx.user, ctx.product)
        } else {
          console.log(
            `[BillingWebhook] No notification required for event ${event.id}`
          )
        }
      },
      { maxWait: 15_000, timeout: 60_000 }
    )

    await deliverNotification(event.id)
    console.log(`[BillingWebhook] Completed processing event ${event.id}`)
  },

  // 1. Failed payment attempt
  handlePaymentFailed: async (ctx: BillingContext): Promise<NoticeEndpoint> => {
    console.log(
      `[BillingWebhook] Executing handlePaymentFailed for subscription ${ctx.subscriptionId}`
    )
    return 'payment-attempt-failed'
  },

  // 2. Subscription terminated / revoked (terminal statuses: canceled, unpaid, paused, etc.)
  handleSubscriptionTerminated: async (
    ctx: BillingContext
  ): Promise<NoticeEndpoint | undefined> => {
    const { tx, existing, event, now } = ctx
    if (!existing) {
      console.warn(
        `[BillingWebhook] handleSubscriptionTerminated: no existing UserLibrary record found for subscription ${ctx.subscriptionId}`
      )
      return
    }

    const accessExpiresAt =
      existing.accessExpiresAt && existing.accessExpiresAt < now
        ? existing.accessExpiresAt
        : now

    await tx.userLibrary.update({
      where: { id: existing.id },
      data: {
        canceledAt: existing.canceledAt ?? now,
        accessExpiresAt,
      },
    })

    console.log(
      `[BillingWebhook] handleSubscriptionTerminated: revoked access for user ${ctx.userId} on product ${ctx.productId} (accessExpiresAt: ${accessExpiresAt.toISOString()})`
    )

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

    console.log(
      `[BillingWebhook] handlePaymentSuccess: access granted/renewed for user ${userId}, product ${productId} until ${accessExpiresAt.toISOString()} (isNew: ${!existing})`
    )

    if (!existing) {
      return 'subscription-started'
    }
  },

  // 4. Subscription updated (e.g. scheduled cancellation at period end)
  handleSubscriptionUpdated: async (
    ctx: BillingContext
  ): Promise<NoticeEndpoint | undefined> => {
    const { tx, existing, scheduledCancellation, now } = ctx
    if (!existing) {
      console.warn(
        `[BillingWebhook] handleSubscriptionUpdated: no existing UserLibrary record found for subscription ${ctx.subscriptionId}`
      )
      return
    }

    // A renewal becomes accessible only after payment, not on subscription.updated.
    await tx.userLibrary.update({
      where: { id: existing.id },
      data: {
        canceledAt: scheduledCancellation ? (existing.canceledAt ?? now) : null,
      },
    })

    console.log(
      `[BillingWebhook] handleSubscriptionUpdated: updated cancellation status for user ${ctx.userId}, product ${ctx.productId} (scheduledCancellation: ${scheduledCancellation})`
    )

    if (scheduledCancellation && !existing.canceledAt) {
      return 'cancel-subscription'
    }
  },
  cancelSubscription: async (user: TokenPayload, subscriptionId: string) => {
    const libraryItem = await libraryRepo.findBySubscription(subscriptionId)

    if (!libraryItem) {
      throw ApiError(404, 'NOT_FOUND', 'Library item not found')
    }
    if (libraryItem.userId !== user.id) {
      throw ApiError(
        403,
        'FORBIDDEN',
        'You are not authorized to cancel this subscription'
      )
    }

    await stripeService.cancelSubscription(subscriptionId)

    await prisma.userLibrary.update({
      where: { id: libraryItem.id },
      data: { canceledAt: new Date() },
    })

    return { response: { success: true } }
  },
}
