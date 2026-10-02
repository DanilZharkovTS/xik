import resend from '../../providers/resend'
import { signingKeyEmailTemplate } from '../../templates/emails/signing-key'
import { subscriptionCanceledEmailTemplate } from '../../templates/emails/subscription'
import { subscriptionDeletedEmailTemplate } from '../../templates/emails/subscription-deleted'
import { paymentAttemptFailedEmailTemplate } from '../../templates/emails/payment-attempt-failed'
import { subscriptionStartedEmailTemplate } from '../../templates/emails/subscription-started'
import {
  CancelSubscriptionEmailDto,
  DeleteSubscriptionEmailDto,
  PaymentAttemptFailedEmailDto,
  SendSigningKeyEmailDto,
  SubscriptionStartedEmailDto,
} from './email.schema'
import { ApiError } from '../../shared/utils/ApiError'

export const emailService = {
  sendSigningKey: async (data: SendSigningKeyEmailDto) => {
    const email = await resend.emails.send({
      from: process.env.EMAIL_FROM! || 'onboarding@resend.dev',
      to: data.to,
      subject: 'XIK — Your signing key',
      html: signingKeyEmailTemplate(data),
      text: `Hi ${data.userName || 'there'},\n\nHere is your signing key for ${data.productName}:\n\n${data.signingKey}\n\nKeep this key private. Do not share it with anyone.\n\nIf you did not request this signing key, you can safely ignore this email.\n\n— XIK`,
    })

    if (email.error) {
      throw ApiError(400, email.error.message, 'EMAIL_SEND_FAILED')
    }

    return { response: { email } }
  },
  sendCanceledSubscription: async (data: CancelSubscriptionEmailDto) => {
    const email = await resend.emails.send({
      from: process.env.EMAIL_FROM! || 'onboarding@resend.dev',
      to: data.to,
      subject: 'XIK — Your subscription was canceled',
      html: subscriptionCanceledEmailTemplate(data),
      text: `Hi ${data.userName || 'there'},\n\nYour subscription for ${data.productName} has been canceled.\n\nYou will no longer be charged for this subscription. Your access may remain available until the end of your current billing period.\n\nIf you canceled your subscription by mistake, you can subscribe again at any time.\n\n— XIK`,
    })

    if (email.error) {
      throw ApiError(400, email.error.message, 'EMAIL_SEND_FAILED')
    }

    return { response: { email } }
  },
  sendDeletedSubscription: async (data: DeleteSubscriptionEmailDto) => {
    const email = await resend.emails.send({
      from: process.env.EMAIL_FROM! || 'onboarding@resend.dev',
      to: data.to,
      subject: 'XIK — Your subscription was deleted',
      html: subscriptionDeletedEmailTemplate(data),
      text: `Hi ${
        data.userName || 'there'
      },\n\nYour subscription for ${
        data.productName
      } has been deleted.\n\nYour access has been revoked. If you wish to use ${
        data.productName
      } again, you can resubscribe at any time.\n\nIf you believe this is a mistake or need help, please contact our support team.\n\n— XIK`,
    })

    if (email.error) {
      throw ApiError(400, email.error.message, 'EMAIL_SEND_FAILED')
    }

    return { response: { email } }
  },
  sendPaymentAttemptFailed: async (data: PaymentAttemptFailedEmailDto) => {
    const email = await resend.emails.send({
      from: process.env.EMAIL_FROM! || 'onboarding@resend.dev',
      to: data.to,
      subject: 'XIK — Payment attempt unsuccessful',
      html: paymentAttemptFailedEmailTemplate(data),
      text: `Hi ${data.userName || 'there'},\n\nWe attempted to charge your card for ${data.productName}, but the transaction could not be completed.\n\nPlease check your payment details: ensure your card has sufficient funds, has not expired, and that online transactions are enabled. We will automatically retry the charge soon.\n\nTo prevent any interruption of your service, please verify or update your payment information.\n\n— XIK`,
    })

    if (email.error) {
      throw ApiError(400, email.error.message, 'EMAIL_SEND_FAILED')
    }

    return { response: { email } }
  },
  sendSubscriptionStarted: async (data: SubscriptionStartedEmailDto) => {
    const email = await resend.emails.send({
      from: process.env.EMAIL_FROM! || 'onboarding@resend.dev',
      to: data.to,
      subject: `XIK — Welcome! Your ${data.productName} subscription is active 🎉`,
      html: subscriptionStartedEmailTemplate(data),
      text: `Hi ${data.userName || 'there'},\n\nThank you for subscribing to ${data.productName}! Your payment was successful, and your subscription is now active.\n\nYou have full access to all features and updates. You can manage your subscription settings directly in your account dashboard.\n\nEnjoy using ${data.productName}!\n\n— XIK`,
    })

    if (email.error) {
      throw ApiError(400, email.error.message, 'EMAIL_SEND_FAILED')
    }

    return { response: { email } }
  },
}
