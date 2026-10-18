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
import { licenseService } from '../license/license.service.js'

type NoticeEndpoint =
  | 'subscription-started'
  | 'send-device-key'
  | 'cancel-subscription'
  | 'delete-subscription'
  | 'payment-attempt-failed'

interface NoticePayload {
  endpoint: NoticeEndpoint
  deviceKey?: string
}

type Notice = {
  endpoint: NoticeEndpoint
  body: {
    to: string
    productName: string
    userName: string
    locale: string
    deviceKey?: string
  }
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
  console.log(
    `[BillingWebhook:Context] Retrieving Stripe subscription ${subscriptionId}...`
  )
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  console.log(
    `[BillingWebhook:Context] Retrieved Stripe subscription ${subscriptionId} (status: ${subscription.status})`
  )

  const existing = await tx.userLibrary.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })
  console.log(
    `[BillingWebhook:Context] Existing UserLibrary record: ${
      existing
        ? `found (id: ${existing.id}, accessExpiresAt: ${existing.accessExpiresAt?.toISOString() ?? 'none'}, licenseId: ${existing.licenseId ?? 'none'})`
        : 'none'
    }`
  )

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
      `[BillingWebhook:Context] Missing userId (${userId}) or productId (${productId}) for subscription ${subscriptionId}, skipping external subscription`
    )
    return null
  }

  const [user, product] = await Promise.all([
    tx.user.findUnique({ where: { id: userId } }),
    tx.product.findUnique({ where: { id: productId } }),
  ])

  if (!user || !product) {
    console.error(
      `[BillingWebhook:Context] User or product missing in DB (userId: ${userId}, productId: ${productId})`
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
      `[BillingWebhook:Context] Ownership mismatch: existing (user: ${existing.userId}, product: ${existing.productId}) vs incoming (user: ${userId}, product: ${productId})`
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
    `[BillingWebhook:Context] Billing context built successfully: user=${user.email}, product=${product.name}, terminal=${terminal}, scheduledCancellation=${scheduledCancellation}`
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
): Promise<NoticePayload | undefined> => {
  console.log(
    `[BillingWebhook:Dispatch] Dispatching event ${ctx.event.id} (${ctx.event.type}) for subscription ${ctx.subscriptionId}`
  )

  if (ctx.event.type === 'invoice.payment_failed') {
    console.log(
      `[BillingWebhook:Dispatch] Routing to handlePaymentFailed`
    )
    return billingService.handlePaymentFailed(ctx)
  }

  if (ctx.terminal) {
    console.log(
      `[BillingWebhook:Dispatch] Subscription is terminal (${ctx.subscription.status}). Routing to handleSubscriptionTerminated`
    )
    return billingService.handleSubscriptionTerminated(ctx)
  }

  if (
    ctx.event.type === 'invoice.paid' ||
    ctx.event.type.startsWith('checkout.session.')
  ) {
    console.log(
      `[BillingWebhook:Dispatch] Payment event (${ctx.event.type}). Routing to handlePaymentSuccess`
    )
    return billingService.handlePaymentSuccess(ctx)
  }

  console.log(
    `[BillingWebhook:Dispatch] Routing to handleSubscriptionUpdated`
  )
  return billingService.handleSubscriptionUpdated(ctx)
}

const saveBillingNotice = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  payload: NoticePayload,
  user: User,
  product: Product
): Promise<void> => {
  console.log(
    `[BillingWebhook:Notice] Scheduling notice '${payload.endpoint}' for event ${eventId} (to: ${user.email}, deviceKey: ${payload.deviceKey ? 'present' : 'none'})`
  )

  const notice: Notice = {
    endpoint: payload.endpoint,
    body: {
      to: user.email,
      userName: user.name,
      productName: product.name,
      locale: user.locale,
      deviceKey: payload.deviceKey,
    },
  }

  await tx.billingEvent.update({
    where: { id: eventId },
    data: { notification: notice as unknown as Prisma.InputJsonValue },
  })
  console.log(
    `[BillingWebhook:Notice] Notice record saved in BillingEvent for event ${eventId}`
  )
}

// Delivery is retried on Stripe redelivery. Resend also receives a stable idempotency key.
const deliverNotification = async (eventId: string): Promise<void> => {
  console.log(
    `[BillingWebhook:Deliver] Checking pending notification for event ${eventId}...`
  )
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "BillingEvent" WHERE "id" = ${eventId} FOR UPDATE`

      const record = await tx.billingEvent.findUnique({
        where: { id: eventId },
      })

      if (!record?.notification) {
        console.log(
          `[BillingWebhook:Deliver] No notification payload found for event ${eventId}, skipping delivery`
        )
        return
      }

      if (record.notificationSentAt) {
        console.log(
          `[BillingWebhook:Deliver] Notification for event ${eventId} was already sent at ${record.notificationSentAt.toISOString()}, skipping delivery`
        )
        return
      }

      const notice = record.notification as unknown as Notice
      const base = process.env.NOTIFICATIONS_SERVICE_URL
      const secret = process.env.NOTIFICATIONS_SERVICE_SECRET

      if (!base || !secret) {
        console.error(
          `[BillingWebhook:Deliver] Notifications service credentials not configured (url: ${Boolean(base)}, secret: ${Boolean(secret)})`
        )
        throw ApiError(
          503,
          'NOTIFICATIONS_UNAVAILABLE',
          'Notifications are not configured'
        )
      }

      console.log(
        `[BillingWebhook:Deliver] Delivering notification '${notice.endpoint}' to ${notice.body.to} for event ${eventId} via ${base}...`
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
          `[BillingWebhook:Deliver] Notification request failed with status ${response.status} for event ${eventId}`
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
        `[BillingWebhook:Deliver] Notification '${notice.endpoint}' delivered successfully for event ${eventId}`
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

    console.log(
      `[BillingWebhook] Processing event ${event.id} for subscription ${subscriptionId}...`
    )

    await prisma.$transaction(
      async (tx) => {
        // Serialize events for a subscription and reconcile with its current Stripe state,
        // rather than letting a late invoice resurrect a deleted subscription.
        console.log(
          `[BillingWebhook:Tx] Acquiring advisory lock for subscription ${subscriptionId}...`
        )
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${subscriptionId}, 0))`

        const claimed = await tx.billingEvent.createMany({
          data: { id: event.id },
          skipDuplicates: true,
        })
        if (claimed.count === 0) {
          console.log(
            `[BillingWebhook:Tx] Event ${event.id} was claimed concurrently by another transaction, skipping`
          )
          return
        }

        console.log(
          `[BillingWebhook:Tx] Building billing context for subscription ${subscriptionId}...`
        )
        const ctx = await buildBillingContext(tx, event, subscriptionId)
        if (!ctx) {
          console.warn(
            `[BillingWebhook:Tx] Could not build billing context for event ${event.id}, skipping`
          )
          return
        }

        const payload = await dispatchWebhook(ctx)
        if (payload?.endpoint) {
          await saveBillingNotice(tx, event.id, payload, ctx.user, ctx.product)
        } else {
          console.log(
            `[BillingWebhook:Tx] No notification payload returned for event ${event.id}`
          )
        }
      },
      { maxWait: 15_000, timeout: 60_000 }
    )

    console.log(
      `[BillingWebhook] Transaction committed for event ${event.id}. Triggering deliverNotification...`
    )
    await deliverNotification(event.id)
    console.log(`[BillingWebhook] Finished processing event ${event.id}`)
  },

  // 1. Failed payment attempt
  handlePaymentFailed: async (ctx: BillingContext): Promise<NoticePayload> => {
    console.log(
      `[BillingWebhook:handlePaymentFailed] Payment failed for subscription ${ctx.subscriptionId}`
    )
    return {
      endpoint: 'payment-attempt-failed',
    }
  },

  // 2. Subscription terminated / revoked (terminal statuses: canceled, unpaid, paused, etc.)
  handleSubscriptionTerminated: async (
    ctx: BillingContext
  ): Promise<NoticePayload | undefined> => {
    const { tx, existing, event, now } = ctx
    if (!existing) {
      console.warn(
        `[BillingWebhook:handleSubscriptionTerminated] No existing UserLibrary record found for subscription ${ctx.subscriptionId}`
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
      `[BillingWebhook:handleSubscriptionTerminated] Revoked access for user ${ctx.userId} on product ${ctx.productId} (accessExpiresAt: ${accessExpiresAt.toISOString()})`
    )

    if (event.type === 'customer.subscription.deleted') {
      return {
        endpoint: 'delete-subscription',
      }
    }
  },

  // 3. Successful payment (checkout session or paid invoice)
  handlePaymentSuccess: async (
    ctx: BillingContext
  ): Promise<NoticePayload | undefined> => {
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

    console.log(
      `[BillingWebhook:handlePaymentSuccess] Calculated period: paidUntil=${paidUntil.toISOString()}, accessExpiresAt=${accessExpiresAt.toISOString()}, isNew=${!existing}`
    )

    console.log(
      `[BillingWebhook:handlePaymentSuccess] Requesting license for ${ctx.user.email}, product ${ctx.product.id}...`
    )
    const license = await licenseService.getLicense({
      email: ctx.user.email,
      product_id: ctx.product.id,
      plan: `pro_${ctx.product.billingPeriod}`,
      plan_tier: 'pro',
      max_devices: 1,
      expires_at: accessExpiresAt,
    })

    console.log(
      `[BillingWebhook:handlePaymentSuccess] License created/retrieved: id=${license.id}, key=${license.key}`
    )

    await tx.userLibrary.upsert({
      where: { stripeSubscriptionId: subscriptionId },
      create: {
        userId,
        productId,
        stripeSubscriptionId: subscriptionId,
        subscriptionId,
        licenseId: license.id,
        accessExpiresAt,
        canceledAt,
      },
      update: {
        accessExpiresAt,
        canceledAt,
        subscriptionId,
        licenseId: license.id,
      },
    })

    console.log(
      `[BillingWebhook:handlePaymentSuccess] UserLibrary upserted for user ${userId}, product ${productId}, subscription ${subscriptionId}`
    )
    
    if (!existing) {
      console.log(
        `[BillingWebhook:handlePaymentSuccess] New subscription: returning notice 'subscription-started'`
      )
      return {
        endpoint: 'subscription-started',
        deviceKey: license.key,
      }
    } else {
      console.log(
        `[BillingWebhook:handlePaymentSuccess] Existing subscription renewal: returning notice 'send-device-key'`
      )
      return {
        endpoint: 'send-device-key',
        deviceKey: license.key,
      }
    }
  },

  // 4. Subscription updated (e.g. scheduled cancellation at period end)
  handleSubscriptionUpdated: async (
    ctx: BillingContext
  ): Promise<NoticePayload | undefined> => {
    const { tx, existing, scheduledCancellation, now } = ctx
    if (!existing) {
      console.warn(
        `[BillingWebhook:handleSubscriptionUpdated] No existing UserLibrary record found for subscription ${ctx.subscriptionId}`
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
      `[BillingWebhook:handleSubscriptionUpdated] Updated cancellation status for user ${ctx.userId}, product ${ctx.productId} (scheduledCancellation: ${scheduledCancellation})`
    )

    if (scheduledCancellation && !existing.canceledAt) {
      return {
        endpoint: 'cancel-subscription',
      }
    }
  },
  cancelSubscription: async (user: TokenPayload, subscriptionId: string) => {
    const libraryItem = await libraryRepo.findById(subscriptionId)

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

    if (!libraryItem.stripeSubscriptionId) {
      throw ApiError(400, 'BAD_REQUEST', 'Item is not an active subscription')
    }

    await stripeService.cancelSubscription(libraryItem.stripeSubscriptionId)

    await libraryRepo.cancelById(subscriptionId)

    return { response: { success: true } }
  },
  restoreSubscription: async (user: TokenPayload, subscriptionId: string) => {
    const libraryItem = await libraryRepo.findById(subscriptionId)

    if (!libraryItem) {
      throw ApiError(404, 'NOT_FOUND', 'Library item not found')
    }
    if (libraryItem.userId !== user.id) {
      throw ApiError(
        403,
        'FORBIDDEN',
        'You are not authorized to restore this subscription'
      )
    }
    if (!libraryItem.canceledAt) {
      throw ApiError(400, 'BAD_REQUEST', 'Subscription is not canceled')
    }
    if (!libraryItem.stripeSubscriptionId) {
      throw ApiError(400, 'BAD_REQUEST', 'Item is not an active subscription')
    }

    await stripeService.restoreSubscription(libraryItem.stripeSubscriptionId)
    await libraryRepo.restoreCanceledById(subscriptionId)

    return { response: { success: true } }
  },
}
