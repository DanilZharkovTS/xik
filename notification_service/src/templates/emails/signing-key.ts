import { SendSigningKeyEmailDto } from '../../modules/email/email.schema'
import { baseEmailLayout } from './layout'

export const signingKeyEmailTemplate = (data: SendSigningKeyEmailDto) => {
  return baseEmailLayout({
    title: 'Your XIK signing key',
    footerNote: 'If you did not request this signing key, you can safely ignore this email.',
    content: `
      <h1 style="
        margin: 0 0 16px;
        font-size: 24px;
        line-height: 1.3;
        font-weight: 700;
        color: #171717;
      ">
        Your signing key
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
        Here is your signing key for
        <strong style="color: #171717;">
          ${data.productName}
        </strong>.
      </p>

      <div style="
        margin: 0 0 24px;
        padding: 20px;
        background-color: #f5f5f5;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
      ">
        <div style="
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #737373;
        ">
          Signing key
        </div>

        <div style="
          font-family: 'Courier New', Courier, monospace;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-all;
          color: #171717;
        ">
          ${data.signingKey}
        </div>
      </div>

      <div style="
        padding: 16px;
        background-color: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 8px;
      ">
        <p style="
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #9a3412;
        ">
          <strong>Keep this key private.</strong>
          Do not share it with anyone.
        </p>
      </div>
    `,
  })
}
