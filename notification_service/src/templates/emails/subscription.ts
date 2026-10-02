import { CancelSubscriptionEmailDto } from '../../modules/email/email.schema'
import { baseEmailLayout } from './layout'

export const subscriptionCanceledEmailTemplate = (
  data: CancelSubscriptionEmailDto
) => {
  return baseEmailLayout({
    title: 'Your subscription was canceled',
    content: `
      <h1 style="
        margin: 0 0 16px;
        font-size: 24px;
        line-height: 1.3;
        font-weight: 700;
        color: #171717;
      ">
        Your subscription was canceled
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
        has been canceled.
      </p>

      <div style="
        margin: 0 0 24px;
        padding: 16px;
        background-color: #f5f5f5;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
      ">
        <p style="
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #525252;
        ">
          You will no longer be charged for this subscription.
          Your access may remain available until the end of your
          current billing period.
        </p>
      </div>

      <p style="
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: #737373;
      ">
        If you canceled your subscription by mistake, you can
        subscribe again at any time.
      </p>
    `,
  })
}
