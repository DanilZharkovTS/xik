import { DeleteSubscriptionEmailDto } from '../../modules/email/email.schema'
import { baseEmailLayout } from './layout'

export const subscriptionDeletedEmailTemplate = (
  data: DeleteSubscriptionEmailDto
) => {
  return baseEmailLayout({
    title: 'Your subscription has been deleted',
    content: `
      <h1 style="
        margin: 0 0 16px;
        font-size: 24px;
        line-height: 1.3;
        font-weight: 700;
        color: #171717;
      ">
        Subscription deleted
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
        Your subscription for
        <strong style="color: #171717;">
          ${data.productName}
        </strong>
        has been deleted.
      </p>

      <div style="
        margin: 0 0 24px;
        padding: 16px;
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
      ">
        <p style="
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #991b1b;
        ">
          <strong>Your access has been revoked.</strong>
          If you wish to use ${data.productName} again, you can resubscribe at any time.
        </p>
      </div>

      <p style="
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: #737373;
      ">
        If you believe this is a mistake or need help,
        please contact our support team.
      </p>
    `,
  })
}
