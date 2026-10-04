'use client'

import { Fragment, useEffect } from 'react'
import type { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { MessageKey } from '@/src/shared/i18n/messages'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { cn } from '@/src/shared/lib/cn'
import { toast } from 'sonner'
import { outreachService } from '../outreach.service'
import { useOutreachStore } from '../outreach-store'
import { ProductSwitcher } from './ProductSwitcher'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const NAV_ITEMS: { href: string; labelKey: MessageKey }[] = [
  { href: '/outreach/check', labelKey: 'journal.check' },
  { href: '/outreach/targets', labelKey: 'journal.targets' },
  { href: '/outreach/publications', labelKey: 'journal.publications' },
  { href: '/outreach/templates', labelKey: 'journal.templates' },
  { href: '/outreach/reports', labelKey: 'journal.reports' },
]

export function OutreachShell({ children }: { children: ReactNode }): ReactElement {
  const { t } = useI18n()
  const pathname = usePathname()
  const token = useAuthStore((state) => state.accessToken)
  const sessionId = useAuthStore((state) => state.user?.sessionId)
  const productId = useOutreachStore((state) => state.selectedProductId)
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const status = useOutreachStore((state) => state.status)
  const products = useOutreachStore((state) => state.products)
  const setProducts = useOutreachStore((state) => state.setProducts)
  const setError = useOutreachStore((state) => state.setError)

  useEffect(() => {
    if (!token) return

    let isCancelled = false

    outreachService
      .listProducts(token)
      .then((loaded) => {
        if (!isCancelled) setProducts(loaded)
      })
      .catch((err: unknown) => {
        if (isCancelled) return
        toast.error(getErrorMessage(err))
        setError()
      })

    return () => {
      isCancelled = true
    }
  }, [token, setProducts, setError])

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-4 pt-2 md:pb-10 md:pt-8">
      <div className="mb-2 flex items-center md:mb-4 md:items-center justify-between gap-3">
        <ProductSwitcher />

        {/* Розділи журналу: на десктопі праворуч від продукту, на телефоні окремим рядком нижче. */}
        <nav aria-label={t('nav.journal')} className="hidden gap-1 md:flex">
          {NAV_ITEMS.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-base font-medium',
                pathname === href
                  ? 'bg-[var(--t)] text-[var(--bg)]'
                  : 'text-[var(--m)] hover:text-[var(--t)]',
              )}
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>
      </div>

      {products.length > 0 && (
        <nav
          aria-label={t('journal.section')}
          className="-mx-4 mb-3 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:hidden"
        >
          {NAV_ITEMS.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-medium',
                pathname === href
                  ? 'border-[var(--t)] bg-[var(--t)] text-[var(--bg)]'
                  : 'border-[var(--l)] text-[var(--m)]',
              )}
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>
      )}

      {status === 'loading' || (token === null && status !== 'error') ? (
        <p className="py-12 text-center text-[var(--m)]">{t('common.loading')}</p>
      ) : status === 'error' ? (
        <p className="py-12 text-center text-[var(--m)]">
          {t('journal.loadFailed')}
        </p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">{t('journal.noProducts')}</p>
          <p className="mt-1 text-sm text-[var(--m)]">
            {isAdmin
              ? t('journal.noProductsAdmin')
              : t('journal.noProductsMod')}
          </p>
          {isAdmin && (
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/admin/products"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--t)] bg-[var(--t)] px-5 font-medium text-[var(--bg)]"
              >
                {t('nav.products')}
              </Link>
              <Link
                href="/admin/team"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--l)] px-5 font-medium"
              >
                {t('nav.team')}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Fragment key={`${sessionId}:${productId}`}>{children}</Fragment>
      )}

    </div>
  )
}
