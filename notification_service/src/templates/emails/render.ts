import { baseEmailLayout } from './layout'
import { COMMON, COPY, EMAIL_LOCALES, PASSWORD_RESET_COPY, PASSWORD_CHANGED_COPY } from './copy'
import type { EmailData, EmailKind, EmailLocale } from './copy'

const TONES = {
  info: { bg: '#eff6ff', border: '#dbeafe', color: '#1e40af' },
  warn: { bg: '#fffbeb', border: '#fef3c7', color: '#92400e' },
  danger: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
  neutral: { bg: '#f5f5f5', border: '#e5e5e5', color: '#525252' },
} as const

// Значення з даних потрапляють у HTML, тож екрануються.
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const resolveLocale = (value: unknown): EmailLocale =>
  EMAIL_LOCALES.includes(value as EmailLocale) ? (value as EmailLocale) : 'en'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export function renderEmail(kind: EmailKind, localeInput: unknown, data: EmailData): RenderedEmail {
  const locale = resolveLocale(localeInput)
  const copy = COPY[kind][locale]
  const common = COMMON[locale]
  const name = data.userName?.trim() || common.fallbackName
  const product = escapeHtml(data.productName)

  const paragraph = (html: string) =>
    `<p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #525252;">${html}</p>`

  const callout = copy.callout
    ? (() => {
        const tone = TONES[copy.callout.tone]
        return `<div style="margin: 0 0 24px; padding: 16px; background-color: ${tone.bg}; border: 1px solid ${tone.border}; border-radius: 8px;"><p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${tone.color};">${copy.callout.html({ product })}</p></div>`
      })()
    : ''

  const keyBlock =
    data.deviceKey
      ? `<div style="margin: 0 0 24px; padding: 16px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px;"><div style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #737373;">${common.deviceKeyLabel}</div><div style="font-family: monospace; font-size: 14px; word-break: break-all; color: #171717;">${escapeHtml(data.deviceKey)}</div></div>`
      : ''

  const [first, ...rest] = copy.paragraphs({ product })

  const html = baseEmailLayout({
    title: copy.title,
    footerNote: copy.footerNote,
    lang: locale,
    sentBy: common.sentBy,
    content: `
      <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.3; font-weight: 700; color: #171717;">${copy.heading}</h1>
      ${paragraph(escapeHtml(common.hello(name)))}
      ${paragraph(first)}
      ${keyBlock}
      ${callout}
      ${rest.map(paragraph).join('\n')}
    `,
  })

  return {
    subject: copy.subject(data),
    html,
    text: `${common.hello(data.userName?.trim() || common.fallbackName)}\n\n${copy.text(data)}\n\n${common.signature}`,
  }
}

export function renderPasswordResetEmail(
  localeInput: unknown,
  data: { userName?: string; resetUrl: string }
): RenderedEmail {
  const locale = resolveLocale(localeInput)
  const copy = PASSWORD_RESET_COPY[locale]
  const common = COMMON[locale]
  const name = data.userName?.trim() || common.fallbackName
  const resetUrl = data.resetUrl

  const paragraph = (html: string) =>
    `<p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #525252;">${html}</p>`

  const button = `
    <div style="margin: 28px 0; text-align: center;">
      <a
        href="${escapeHtml(resetUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        style="
          display: inline-block;
          background-color: #171717;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 8px;
        "
      >
        ${copy.buttonText}
      </a>
    </div>
  `

  const callout = `
    <div style="margin: 0 0 24px; padding: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
        ${copy.warning}
      </p>
    </div>
  `

  const linkFallback = `
    <p style="margin: 0 0 8px; font-size: 12px; color: #737373;">${copy.alternateLinkText}</p>
    <p style="margin: 0 0 24px; font-size: 12px; word-break: break-all; color: #2563eb;">
      <a href="${escapeHtml(resetUrl)}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(resetUrl)}</a>
    </p>
  `

  const html = baseEmailLayout({
    title: copy.title,
    footerNote: copy.footerNote,
    lang: locale,
    sentBy: common.sentBy,
    content: `
      <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.3; font-weight: 700; color: #171717;">${copy.heading}</h1>
      ${paragraph(escapeHtml(common.hello(name)))}
      ${paragraph(copy.intro)}
      ${button}
      ${linkFallback}
      ${callout}
    `,
  })

  return {
    subject: copy.subject,
    html,
    text: `${copy.text(name, resetUrl)}\n\n${common.signature}`,
  }
}

export function renderPasswordChangedEmail(
  localeInput: unknown,
  data: { userName?: string }
): RenderedEmail {
  const locale = resolveLocale(localeInput)
  const copy = PASSWORD_CHANGED_COPY[locale]
  const common = COMMON[locale]
  const name = data.userName?.trim() || common.fallbackName

  const paragraph = (html: string) =>
    `<p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #525252;">${html}</p>`

  const callout = `
    <div style="margin: 24px 0; padding: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #92400e;">
        <strong>${copy.warningTitle}</strong><br />${copy.warning}
      </p>
    </div>
  `

  const html = baseEmailLayout({
    title: copy.title,
    footerNote: copy.footerNote,
    lang: locale,
    sentBy: common.sentBy,
    content: `
      <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.3; font-weight: 700; color: #171717;">${copy.heading}</h1>
      ${paragraph(escapeHtml(common.hello(name)))}
      ${paragraph(copy.intro)}
      ${paragraph(copy.confirmation)}
      ${callout}
      ${paragraph(copy.signoff.replace(/\n/g, '<br />'))}
    `,
  })

  return {
    subject: copy.subject,
    html,
    text: copy.text(name),
  }
}

