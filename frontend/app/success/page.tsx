import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Payment received',
  robots: { index: false, follow: false },
}

// Сюди Stripe повертає після успішної оплати (success_url у бекенді).
export default function SuccessPage() {
  return (
    <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--t)]">Payment received</h1>
      <p className="text-[var(--m)]">
        Thank you! Your subscription is being activated. This usually takes a few seconds.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--t)] px-6 text-base font-semibold text-[var(--bg)] hover:opacity-90"
      >
        Go to dashboard
      </Link>
    </div>
  )
}
