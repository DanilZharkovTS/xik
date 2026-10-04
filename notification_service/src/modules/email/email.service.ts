import resend from '../../providers/resend'
import { renderEmail } from '../../templates/emails/render'
import type { EmailKind } from '../../templates/emails/copy'
import {
  CancelSubscriptionEmailDto,
  DeleteSubscriptionEmailDto,
  PaymentAttemptFailedEmailDto,
  SendSigningKeyEmailDto,
  SubscriptionStartedEmailDto,
} from './email.schema'
import { ApiError } from '../../shared/utils/ApiError'

type EmailRequest = {
  to: string
  productName: string
  userName?: string
  signingKey?: string
  locale?: string
}

// Усі п'ять листів проходять одним шляхом: текст і тема беруться з шаблонів потрібною мовою.
const send = async (kind: EmailKind, data: EmailRequest, idempotencyKey?: string) => {
  const rendered = renderEmail(kind, data.locale, data)

  const email = await resend.emails.send({
    from: process.env.EMAIL_FROM! || 'onboarding@resend.dev',
    to: data.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  }, idempotencyKey ? { idempotencyKey } : undefined)

  if (email.error) {
    throw ApiError(400, email.error.message, 'EMAIL_SEND_FAILED')
  }

  return { response: { email } }
}

export const emailService = {
  sendSigningKey: (data: SendSigningKeyEmailDto, idempotencyKey?: string) => send('signingKey', data, idempotencyKey),
  sendCanceledSubscription: (data: CancelSubscriptionEmailDto, idempotencyKey?: string) => send('subscriptionCanceled', data, idempotencyKey),
  sendDeletedSubscription: (data: DeleteSubscriptionEmailDto, idempotencyKey?: string) => send('subscriptionDeleted', data, idempotencyKey),
  sendPaymentAttemptFailed: (data: PaymentAttemptFailedEmailDto, idempotencyKey?: string) => send('paymentFailed', data, idempotencyKey),
  sendSubscriptionStarted: (data: SubscriptionStartedEmailDto, idempotencyKey?: string) => send('subscriptionStarted', data, idempotencyKey),
}
