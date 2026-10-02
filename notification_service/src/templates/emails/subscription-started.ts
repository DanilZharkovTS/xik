import { SubscriptionStartedEmailDto } from '../../modules/email/email.schema'
import { baseEmailLayout } from './layout'

export const subscriptionStartedEmailTemplate = (
  data: SubscriptionStartedEmailDto
) => {
  return baseEmailLayout({
    title: 'Welcome to your subscription!',
    content: `
      <h1 style="
        margin: 0 0 16px;
        font-size: 24px;
        line-height: 1.3;
        font-weight: 700;
        color: #171717;
      ">
        Subscription activated! 🎉
      </h1>

      <p style="
        margin: 0 0 24px;
        font-size: 15px;
        line-height: 1.6;
        color: #525252;
      ">
        Hi ${data.userName || 'there'},
      </p>

      <p style="
        margin: 0 0 24px;
        font-size: 15px;
        line-height: 1.6;
        color: #525252;
      ">
        Thank you for subscribing to
        <strong style="color: #171717;">
          ${data.productName}
        </strong>!
        Your payment was successful, and your subscription is now officially active.
      </p>

      <div style="
        margin: 0 0 24px;
        padding: 16px;
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
      ">
        <p style="
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #166534;
        ">
          <strong>Full access unlocked:</strong><br />
          You now have unrestricted access to all features and updates of ${data.productName}.
        </p>
      </div>

      <p style="
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: #737373;
      ">
        You can manage your subscription settings and billing details directly in your account dashboard at any time. If you ever have questions, we're here to help!
      </p>
    `,
  })
}
