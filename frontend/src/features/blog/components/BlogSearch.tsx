'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

import { useI18n, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'

export function BlogSearch({ initialQuery = '' }: { initialQuery?: string }) {
  const { t } = useI18n()
  const up = useUrlLocalePath()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(initialQuery)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = value.trim()
    if (trimmed) {
      params.set('q', trimmed)
    } else {
      params.delete('q')
    }
    params.delete('page')

    startTransition(() => {
      const qs = params.toString()
      router.push(up(qs ? `/blog?${qs}` : '/blog'))
    })
  }

  const handleClear = () => {
    setValue('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('page')

    startTransition(() => {
      const qs = params.toString()
      router.push(up(qs ? `/blog?${qs}` : '/blog'))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md" role="search">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[var(--m)]" />
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('blog.search.placeholder')}
          className="h-10 w-full rounded-full border border-[var(--l)] bg-[var(--s)] pl-10 pr-9 text-sm text-[var(--t)] placeholder:text-[var(--m)] focus:border-[var(--b)] focus:outline-none focus:ring-1 focus:ring-[var(--b)] transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={t('blog.search.clear')}
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full text-[var(--m)] hover:bg-[var(--l)] hover:text-[var(--t)] transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {isPending && (
        <span className="sr-only">Loading results...</span>
      )}
    </form>
  )
}
