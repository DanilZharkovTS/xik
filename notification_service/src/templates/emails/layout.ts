interface BaseEmailLayoutProps {
  title: string
  content: string
  footerNote?: string
}

export const baseEmailLayout = ({
  title,
  content,
  footerNote,
}: BaseEmailLayoutProps) => {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>

    <body style="
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      font-family: Arial, Helvetica, sans-serif;
      color: #171717;
    ">
      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="padding: 40px 20px;"
      >
        <tr>
          <td align="center">
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="
                max-width: 560px;
                background-color: #ffffff;
                border: 1px solid #e5e5e5;
                border-radius: 12px;
                overflow: hidden;
              "
            >
              <tr>
                <td style="padding: 32px 32px 24px;">
                  <div style="
                    font-size: 24px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                  ">
                    XIK
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 32px 32px;">
                  ${content}
                </td>
              </tr>

              <tr>
                <td style="
                  padding: 20px 32px;
                  border-top: 1px solid #e5e5e5;
                ">
                  <p style="
                    margin: 0;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #a3a3a3;
                  ">
                    This email was sent by XIK.${footerNote ? ` ${footerNote}` : ''}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}
