import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Locale } from '@/src/shared/i18n/i18n-store'
import { withLocale } from '@/src/shared/i18n/paths'

// Мінімальна розмітка тексту, яку вводить адмін: **жирний**, *курсив*, [текст](посилання) і
// списки "- ". Збирається в React-елементи, а не в HTML-рядок, тож ін'єкція розмітки неможлива.
const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g

const isInternal = (url: string): boolean => url.startsWith('/') && !url.startsWith('//')
const isSafe = (url: string): boolean => isInternal(url) || /^(https?:\/\/|mailto:)/i.test(url)

const inline = (text: string, locale: Locale, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  let last = 0
  let index = 0

  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const key = `${keyPrefix}-${index++}`
    const [, bold, italic, label, url] = match

    if (bold) nodes.push(<strong key={key}>{bold}</strong>)
    else if (italic) nodes.push(<em key={key}>{italic}</em>)
    else if (label && url) {
      if (!isSafe(url)) nodes.push(label)
      else if (isInternal(url)) {
        nodes.push(
          <Link key={key} href={withLocale(url, locale)} className="text-[var(--b)] underline underline-offset-2">
            {label}
          </Link>,
        )
      } else {
        nodes.push(
          <a key={key} href={url} rel="noopener noreferrer" target="_blank" className="text-[var(--b)] underline underline-offset-2">
            {label}
          </a>,
        )
      }
    }

    last = match.index + match[0].length
  }

  if (last < text.length) nodes.push(text.slice(last))

  return nodes
}

export function RichText({ text, locale }: { text: string; locale: Locale }) {
  const groups = text.split(/\n{2,}/).map((group) => group.trim()).filter(Boolean)

  return (
    <>
      {groups.map((group, groupIndex) => {
        const lines = group.split('\n')
        const isList = lines.every((line) => line.startsWith('- '))

        if (isList) {
          return (
            <ul key={groupIndex} className="my-5 list-disc space-y-2 pl-6">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{inline(line.slice(2), locale, `${groupIndex}-${lineIndex}`)}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={groupIndex} className="my-5">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {inline(line, locale, `${groupIndex}-${lineIndex}`)}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}
