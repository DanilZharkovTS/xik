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
const send = async (kind: EmailKind, data: EmailRequest) => {
  const rendered = renderEmail(kind, data.locale, data)

  const email = await resend.emails.send({
    from: process.env.EMAIL_FROM! || 'onboarding@resend.dev',
    to: data.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  })

  if (email.error) {
    throw ApiError(400, email.error.message, 'EMAIL_SEND_FAILED')
  }

  return { response: { email } }
}

export const emailService = {
  sendSigningKey: (data: SendSigningKeyEmailDto) => send('signingKey', data),
  sendCanceledSubscription: (data: CancelSubscriptionEmailDto) => send('subscriptionCanceled', data),
  sendDeletedSubscription: (data: DeleteSubscriptionEmailDto) => send('subscriptionDeleted', data),
  sendPaymentAttemptFailed: (data: PaymentAttemptFailedEmailDto) => send('paymentFailed', data),
  sendSubscriptionStarted: (data: SubscriptionStartedEmailDto) => send('subscriptionStarted', data),
}
