import { PaymentAttemptFailedEmailDto } from '../../modules/email/email.schema'
import { baseEmailLayout } from './layout'

export const paymentAttemptFailedEmailTemplate = (
  data: PaymentAttemptFailedEmailDto
) => {
  return baseEmailLayout({
    title: 'Payment unsuccessful — action required',
    content: `
      <h1 style="
        margin: 0 0 16px;
        font-size: 24px;
        line-height: 1.3;
        font-weight: 700;
        color: #171717;
      ">
        Payment attempt unsuccessful
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
        We attempted to charge your card for
        <strong style="color: #171717;">
          ${data.productName}
        </strong>,
        but the transaction could not be completed.
      </p>

      <div style="
        margin: 0 0 24px;
        padding: 16px;
        background-color: #fffbeb;
        border: 1px solid #fef3c7;
        border-radius: 8px;
      ">
        <p style="
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #92400e;
        ">
          <strong>Please check your payment details:</strong><br />
          Ensure that your card has sufficient funds, has not expired, and that online transactions are enabled. We will automatically retry the charge soon.
        </p>
      </div>

      <p style="
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: #737373;
      ">
        To prevent any interruption of your service, please verify or update your payment information.
      </p>
    `,
  })
}
