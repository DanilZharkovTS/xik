import Stripe from 'stripe'
import { prisma } from '../shared/database/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET!)
const WEBHOOK_URL = 'http://localhost:5001/billing/webhook'

interface TestResult {
  scenario: string
  success: boolean
  details: Record<string, unknown>
  error?: string
}

const sendWebhook = async (event: Stripe.Event) => {
  const payload = JSON.stringify(event)
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  })

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body: payload,
  })

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }

  return { status: res.status, body: json }
}

async function main() {
  console.log('========================================================')
  console.log(' STARTING BILLING WEBHOOK VERIFICATION')
  console.log('========================================================\n')

  const results: TestResult[] = []

  // 1. Fetch test user and product
  const user = await prisma.user.findFirst({
    where: { email: 'zharkov.danik.ua@gmail.com' },
  })
  const product = await prisma.product.findFirst({
    where: { id: 'a00213ba-a121-4f16-ab40-ac1959deddac' },
  })

  if (!user || !product) {
    throw new Error('Test user or product not found in database')
  }

  console.log(`Using user: ${user.email} (${user.id})`)
  console.log(`Using product: ${product.name} (${product.id}, stripePriceId: ${product.stripePriceId})\n`)

  // Create Stripe test customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? 'Test User',
  })
  const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id })
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: pm.id },
  })

  // Create Stripe test subscription
  const sub = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: product.stripePriceId! }],
    metadata: {
      userId: user.id,
      productId: product.id,
    },
  })

  console.log(`Created Stripe subscription: ${sub.id} (status: ${sub.status})\n`)

  try {
    // ----------------------------------------------------
    // SCENARIO 1: invoice.paid
    // ----------------------------------------------------
    console.log('--- [TEST 1] invoice.paid ---')
    const paidPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 3600 // +30 days
    const invoicePaidEvent: Stripe.Event = {
      id: `evt_test_paid_${Date.now()}`,
      object: 'event',
      api_version: '2024-06-20' as any,
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.paid',
      data: {
        object: {
          id: `in_test_${Date.now()}`,
          object: 'invoice',
          customer: customer.id,
          subscription: sub.id,
          status: 'paid',
          lines: {
            object: 'list',
            data: [
              {
                id: `il_test_${Date.now()}`,
                object: 'line_item',
                subscription: sub.id,
                period: {
                  start: Math.floor(Date.now() / 1000),
                  end: paidPeriodEnd,
                },
              } as any,
            ],
            has_more: false,
            url: '',
          },
        } as any,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
    }

    const res1 = await sendWebhook(invoicePaidEvent)
    console.log('Webhook response:', res1)

    // Check DB
    const lib1 = await prisma.userLibrary.findUnique({
      where: { stripeSubscriptionId: sub.id },
    })
    const evt1 = await prisma.billingEvent.findUnique({
      where: { id: invoicePaidEvent.id },
    })

    const test1Success =
      res1.status === 200 &&
      lib1 !== null &&
      lib1.licenseId !== null &&
      lib1.licenseKey !== null &&
      lib1.accessExpiresAt !== null &&
      lib1.canceledAt === null &&
      (evt1?.notification as any)?.endpoint === 'subscription-started' &&
      evt1?.notificationSentAt !== null

    results.push({
      scenario: '1. invoice.paid',
      success: !!test1Success,
      details: {
        webhookStatus: res1.status,
        userLibraryFound: !!lib1,
        licenseId: lib1?.licenseId,
        licenseKey: lib1?.licenseKey,
        accessExpiresAt: lib1?.accessExpiresAt?.toISOString(),
        canceledAt: lib1?.canceledAt,
        noticeEndpoint: (evt1?.notification as any)?.endpoint,
        noticeSentAt: evt1?.notificationSentAt?.toISOString(),
      },
    })
    console.log(`Result 1: ${test1Success ? 'PASSED ✅' : 'FAILED ❌'}\n`)

    // ----------------------------------------------------
    // SCENARIO 2A: customer.subscription.updated (Cancel at period end)
    // ----------------------------------------------------
    console.log('--- [TEST 2A] customer.subscription.updated (cancel_at_period_end) ---')
    // Update subscription in Stripe to cancel_at_period_end
    const updatedSub = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    })

    const subUpdatedEvent: Stripe.Event = {
      id: `evt_test_cancel_scheduled_${Date.now()}`,
      object: 'event',
      api_version: '2024-06-20' as any,
      created: Math.floor(Date.now() / 1000),
      type: 'customer.subscription.updated',
      data: {
        object: updatedSub,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
    }

    const res2a = await sendWebhook(subUpdatedEvent)
    console.log('Webhook response:', res2a)

    const lib2a = await prisma.userLibrary.findUnique({
      where: { stripeSubscriptionId: sub.id },
    })
    const evt2a = await prisma.billingEvent.findUnique({
      where: { id: subUpdatedEvent.id },
    })

    // Notice: accessExpiresAt should NOT be expired yet, but canceledAt must be set!
    const test2aSuccess =
      res2a.status === 200 &&
      lib2a !== null &&
      lib2a.canceledAt !== null &&
      lib2a.accessExpiresAt !== null &&
      lib2a.accessExpiresAt.getTime() > Date.now() &&
      (evt2a?.notification as any)?.endpoint === 'cancel-subscription' &&
      evt2a?.notificationSentAt !== null

    results.push({
      scenario: '2A. Subscription canceled at period end (customer.subscription.updated)',
      success: !!test2aSuccess,
      details: {
        webhookStatus: res2a.status,
        canceledAt: lib2a?.canceledAt?.toISOString(),
        accessExpiresAt: lib2a?.accessExpiresAt?.toISOString(),
        stillHasActiveAccess: lib2a?.accessExpiresAt ? lib2a.accessExpiresAt.getTime() > Date.now() : false,
        noticeEndpoint: (evt2a?.notification as any)?.endpoint,
        noticeSentAt: evt2a?.notificationSentAt?.toISOString(),
      },
    })
    console.log(`Result 2A: ${test2aSuccess ? 'PASSED ✅' : 'FAILED ❌'}\n`)

    // ----------------------------------------------------
    // SCENARIO 2B: customer.subscription.deleted (Immediate cutoff / expiration)
    // ----------------------------------------------------
    console.log('--- [TEST 2B] customer.subscription.deleted (immediate termination) ---')
    // Cancel subscription immediately in Stripe
    const deletedSub = await stripe.subscriptions.cancel(sub.id)

    const subDeletedEvent: Stripe.Event = {
      id: `evt_test_deleted_${Date.now()}`,
      object: 'event',
      api_version: '2024-06-20' as any,
      created: Math.floor(Date.now() / 1000),
      type: 'customer.subscription.deleted',
      data: {
        object: deletedSub,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
    }

    const res2b = await sendWebhook(subDeletedEvent)
    console.log('Webhook response:', res2b)

    const lib2b = await prisma.userLibrary.findUnique({
      where: { stripeSubscriptionId: sub.id },
    })
    const evt2b = await prisma.billingEvent.findUnique({
      where: { id: subDeletedEvent.id },
    })

    // Access must now be immediately expired (accessExpiresAt <= now)
    const test2bSuccess =
      res2b.status === 200 &&
      lib2b !== null &&
      lib2b.canceledAt !== null &&
      lib2b.accessExpiresAt !== null &&
      lib2b.accessExpiresAt.getTime() <= Date.now() + 5000 &&
      (evt2b?.notification as any)?.endpoint === 'delete-subscription' &&
      evt2b?.notificationSentAt !== null

    results.push({
      scenario: '2B. Subscription deleted / terminated (customer.subscription.deleted)',
      success: !!test2bSuccess,
      details: {
        webhookStatus: res2b.status,
        canceledAt: lib2b?.canceledAt?.toISOString(),
        accessExpiresAt: lib2b?.accessExpiresAt?.toISOString(),
        accessRevoked: lib2b?.accessExpiresAt ? lib2b.accessExpiresAt.getTime() <= Date.now() + 5000 : false,
        noticeEndpoint: (evt2b?.notification as any)?.endpoint,
        noticeSentAt: evt2b?.notificationSentAt?.toISOString(),
      },
    })
    console.log(`Result 2B: ${test2bSuccess ? 'PASSED ✅' : 'FAILED ❌'}\n`)

    // ----------------------------------------------------
    // SCENARIO 3: invoice.payment_failed
    // ----------------------------------------------------
    console.log('--- [TEST 3] invoice.payment_failed ---')
    // Create another subscription for a failed payment scenario
    const sub2 = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: product.stripePriceId! }],
      metadata: {
        userId: user.id,
        productId: product.id,
      },
    })

    const paymentFailedEvent: Stripe.Event = {
      id: `evt_test_failed_${Date.now()}`,
      object: 'event',
      api_version: '2024-06-20' as any,
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: `in_test_failed_${Date.now()}`,
          object: 'invoice',
          customer: customer.id,
          subscription: sub2.id,
          status: 'open',
        } as any,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
    }

    const res3 = await sendWebhook(paymentFailedEvent)
    console.log('Webhook response:', res3)

    const lib3 = await prisma.userLibrary.findUnique({
      where: { stripeSubscriptionId: sub2.id },
    })
    const evt3 = await prisma.billingEvent.findUnique({
      where: { id: paymentFailedEvent.id },
    })

    // Payment failed should NOT create UserLibrary access, but should record notice & send email
    const test3Success =
      res3.status === 200 &&
      lib3 === null &&
      (evt3?.notification as any)?.endpoint === 'payment-attempt-failed' &&
      evt3?.notificationSentAt !== null

    results.push({
      scenario: '3. invoice.payment_failed',
      success: !!test3Success,
      details: {
        webhookStatus: res3.status,
        userLibraryCreated: lib3 !== null,
        noticeEndpoint: (evt3?.notification as any)?.endpoint,
        noticeSentAt: evt3?.notificationSentAt?.toISOString(),
      },
    })
    console.log(`Result 3: ${test3Success ? 'PASSED ✅' : 'FAILED ❌'}\n`)

    // Clean up sub2
    await stripe.subscriptions.cancel(sub2.id).catch(() => {})

  } finally {
    // Clean up customer & test data
    console.log('--- Cleaning up test records ---')
    await stripe.customers.del(customer.id).catch(() => {})
    await prisma.userLibrary.deleteMany({
      where: { stripeSubscriptionId: sub.id },
    })
    console.log('Cleanup finished.')
  }

  console.log('\n========================================================')
  console.log(' FINAL VERIFICATION SUMMARY')
  console.log('========================================================')
  console.log(JSON.stringify(results, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification script error:', err)
    process.exit(1)
  })
