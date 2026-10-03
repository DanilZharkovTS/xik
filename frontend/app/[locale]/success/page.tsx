import type { Metadata } from 'next'
import Link from 'next/link'

import { withLocale } from '@/src/shared/i18n/paths'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)

  return {
    title: translate(locale, 'success.title'),
    robots: { index: false, follow: false },
  }
}

// Сюди Stripe повертає після успішної оплати (success_url у бекенді), у мові покупця.
export default async function SuccessPage({ params }: Props) {
  const locale = await localeFromParams(params)

  return (
    <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--t)]">
        {translate(locale, 'success.title')}
      </h1>
      <p className="text-[var(--m)]">{translate(locale, 'success.body')}</p>
      <Link
        href={withLocale('/account', locale)}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--t)] px-6 text-base font-semibold text-[var(--bg)] hover:opacity-90"
      >
        {translate(locale, 'success.cta')}
      </Link>
    </div>
  )
}
