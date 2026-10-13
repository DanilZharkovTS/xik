import resend from '../../providers/resend'
import { renderEmail, renderPasswordResetEmail } from '../../templates/emails/render'
import type { EmailKind } from '../../templates/emails/copy'
import {
  CancelSubscriptionEmailDto,
  DeleteSubscriptionEmailDto,
  PasswordResetEmailDto,
  PaymentAttemptFailedEmailDto,
  SendDeviceKeyEmailDto,
  SubscriptionStartedEmailDto,
} from './email.schema'
import { ApiError } from '../../shared/utils/ApiError'

type EmailRequest = {
  to: string
  productName: string
  userName?: string
  deviceKey?: string
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
  sendDeviceKey: (data: SendDeviceKeyEmailDto, idempotencyKey?: string) =>
    send('deviceKey', { ...data, deviceKey: data.deviceKey ?? data.device_key }, idempotencyKey),
  sendCanceledSubscription: (data: CancelSubscriptionEmailDto, idempotencyKey?: string) => send('subscriptionCanceled', data, idempotencyKey),
  sendDeletedSubscription: (data: DeleteSubscriptionEmailDto, idempotencyKey?: string) => send('subscriptionDeleted', data, idempotencyKey),
  sendPaymentAttemptFailed: (data: PaymentAttemptFailedEmailDto, idempotencyKey?: string) => send('paymentFailed', data, idempotencyKey),
  sendSubscriptionStarted: (data: SubscriptionStartedEmailDto, idempotencyKey?: string) =>
    send('subscriptionStarted', { ...data, deviceKey: data.deviceKey ?? data.device_key }, idempotencyKey),
  sendPasswordReset: async (data: PasswordResetEmailDto, idempotencyKey?: string) => {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/$/, '')
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(data.token)}`

    const rendered = renderPasswordResetEmail(data.locale, {
      userName: data.userName,
      resetUrl,
    })

    const email = await resend.emails.send(
      {
        from: process.env.EMAIL_FROM! || 'onboarding@resend.dev',
        to: data.to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      idempotencyKey ? { idempotencyKey } : undefined
    )

    if (email.error) {
      throw ApiError(400, email.error.message, 'EMAIL_SEND_FAILED')
    }

    return { response: { email } }
  },
}
