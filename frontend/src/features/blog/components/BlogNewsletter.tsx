'use client'

import { useState, type FormEvent } from 'react'
import { Mail, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'

export function BlogNewsletter() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setIsLoading(true)
    // Simulate lightweight subscription / record
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      toast.success(t('blog.newsletter.success'))
    }, 600)
  }

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="relative my-16 overflow-hidden rounded-[28px] border border-[var(--l)] bg-[var(--s)] p-8 sm:p-12 md:p-16"
    >
      {/* Background glow & subtle pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--b)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full blur-3xl opacity-15"
        style={{ background: 'var(--t)' }}
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--l)] bg-[var(--bg)] px-3 py-1 text-xs font-semibold text-[var(--t)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--b)]" />
          <span>XIK Dispatch</span>
        </div>

        <h2
          id="newsletter-heading"
          className="text-2xl font-bold tracking-tight text-[var(--t)] sm:text-3xl md:text-4xl"
        >
          {t('blog.newsletter.title')}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[var(--m)] sm:text-base">
          {t('blog.newsletter.desc')}
        </p>

        {isSubmitted ? (
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--l)] bg-[var(--bg)] px-5 py-3 text-sm font-medium text-[var(--t)]">
            <Check className="h-4 w-4 text-[var(--b)]" />
            <span>{t('blog.newsletter.success')}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <div className="relative flex-1 max-w-md">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--m)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('blog.newsletter.placeholder')}
                className="h-11 w-full rounded-full border border-[var(--l)] bg-[var(--bg)] pl-10 pr-4 text-sm text-[var(--t)] placeholder:text-[var(--m)] focus:border-[var(--b)] focus:outline-none focus:ring-1 focus:ring-[var(--b)] transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 rounded-full px-6 text-sm font-semibold whitespace-nowrap"
            >
              {isLoading ? '…' : t('blog.newsletter.button')}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
