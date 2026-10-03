'use client'

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { cn } from '@/src/shared/lib/cn'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { SelectField } from '@/src/shared/ui/select-field'
import { TextField } from '@/src/shared/ui/text-field'
import { adminBlogService } from '../admin-blog.service'
import type { AdminArticleRow, ArticleState } from '../admin-blog.types'

const STATES = ['all', 'draft', 'published', 'scheduled', 'archived'] as const

const BADGE: Record<ArticleState, string> = {
  draft: 'bg-[var(--l)] text-[var(--m)]',
  published: 'bg-emerald-500/15 text-[var(--t)]',
  scheduled: 'bg-sky-500/15 text-[var(--t)]',
  archived: 'bg-[var(--l)] text-[var(--m)]',
}

export function AdminBlogScreen(): ReactElement {
  const { t, locale } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const [state, setState] = useState<(typeof STATES)[number]>('all')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<AdminArticleRow[] | null>(null)

  useEffect(() => {
    if (!token) return
    let isCurrent = true

    // Пошук з невеликою затримкою, щоб не слати запит на кожну літеру.
    const timer = setTimeout(() => {
      adminBlogService
        .list({ state, q: query.trim() || undefined }, token)
        .then((result) => isCurrent && setRows(result))
        .catch((err) => toast.error(getErrorMessage(err)))
    }, 250)

    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [token, state, query])

  const date = (value: string | null): string =>
    value ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : ''

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-4 md:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium md:text-3xl">{t('blogAdmin.title')}</h1>
          <p className="text-sm text-[var(--m)]">{t('blogAdmin.subtitle')}</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--t)] bg-[var(--t)] px-5 text-sm font-semibold text-[var(--bg)]"
        >
          {t('blogAdmin.new')}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t('blogAdmin.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <SelectField label={t('blogAdmin.pub.status')} value={state} onChange={(e) => setState(e.target.value as (typeof STATES)[number])}>
          {STATES.map((item) => (
            <option key={item} value={item}>
              {t(`blogAdmin.state.${item}` as 'blogAdmin.state.all')}
            </option>
          ))}
        </SelectField>
      </div>

      {rows === null ? (
        <p className="text-sm text-[var(--m)]">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--l)] p-6 text-center text-sm text-[var(--m)]">{t('blogAdmin.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/blog/${row.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 transition-colors hover:border-[var(--m)] md:p-4"
              >
                {row.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.cover.url} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div aria-hidden="true" className="h-14 w-20 shrink-0 rounded-lg bg-[var(--l)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{row.title || t('blogAdmin.untitled')}</p>
                  <p className="mt-0.5 text-sm text-[var(--m)]">
                    {[row.category?.name, row.locales.map((code) => code.toUpperCase()).join(' '), date(row.publishedAt ?? row.updatedAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium', BADGE[row.state])}>
                  {t(`blogAdmin.badge.${row.state}` as 'blogAdmin.badge.draft')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
