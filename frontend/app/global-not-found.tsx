import './globals.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found | XIK',
  robots: { index: false, follow: false },
}

// Адреса, що не збігається з жодним маршрутом (наприклад, невідома мова): без загального шаблону сторінки.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-5xl font-bold text-[var(--t)]">404</h1>
        <p className="text-[var(--m)]">Page not found</p>
        {/* Тут немає роутера (власний <html>), тож звичайне посилання. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="inline-flex min-h-11 items-center rounded-full bg-[var(--t)] px-6 font-semibold text-[var(--bg)]"
        >
          Go home
        </a>
      </body>
    </html>
  )
}
