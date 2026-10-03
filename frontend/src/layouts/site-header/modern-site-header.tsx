'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useAuthStore from '@/src/features/auth/store'
import { ThemeToggle } from '@/src/features/theme/components/theme-toggle'
import { LanguageSwitch } from '@/src/shared/i18n/language-switch'
import { splitLocale } from '@/src/shared/i18n/paths'
import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'

export function ModernSiteHeader() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const isHome = splitLocale(pathname).path === '/'

  const user = useAuthStore((state) => state.user)
  // Клієнт магазину має свій кабінет, адмін і модератор мають робочу зону.
  // Імʼя показуємо замість загального «Кабінет»: видно, під ким виконано вхід.
  const displayName = user?.name?.trim() || user?.email.split('@')[0] || ''
  const accountHref = user?.role === 'user' ? '/account' : '/dashboard'

  const navLinks = [
    { label: t('site.nav.products'), href: isHome ? '#products' : lp('/#products') },
    { label: t('site.nav.ai'), href: isHome ? '#ai' : lp('/#ai') },
    { label: t('site.nav.services'), href: isHome ? '#services' : lp('/#services') },
    { label: t('site.nav.blog'), href: lp('/blog') },
    { label: t('site.nav.about'), href: isHome ? '#about' : lp('/#about') },
  ]

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[52px] border-b border-[var(--l)] bg-[var(--g)] backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-full max-w-[1180px] items-center gap-5 px-6">
          <Link
            href={lp('/')}
            className="mr-auto text-[19px] font-[750] tracking-tight text-[var(--t)] transition-opacity hover:opacity-80"
          >
            XIK_
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label={t('site.nav.primary')} className="hidden items-center gap-7 text-[13px] font-medium text-[var(--m)] md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-[var(--t)]"
              >
                {link.label}
              </Link>
            ))}

          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitch />
            <ThemeToggle />

            {user ? (
              <Link
                href={accountHref}
                title={`${displayName} · ${user.email}`}
                aria-label={`${t('site.account')}: ${displayName}`}
                className="max-w-[9rem] truncate rounded-full bg-[var(--t)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] transition-opacity hover:opacity-90"
              >
                {displayName}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-full border border-[var(--l)] px-3.5 py-1.5 text-xs font-medium text-[var(--t)] transition-colors hover:bg-[var(--s)]"
              >
                {t('site.signIn')}
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--l)] text-[var(--t)] md:hidden"
              aria-label={t('site.menu')}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-x-0 top-[52px] z-40 border-b border-[var(--l)] bg-[var(--bg)] px-6 py-6 transition-all duration-300 md:hidden ${
          mobileOpen ? 'block opacity-100' : 'hidden opacity-0'
        }`}
      >
        <div className="flex flex-col text-sm font-medium text-[var(--t)]">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={closeMobile}
              className="py-3 transition-colors hover:text-[var(--b)]"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <Link
              href={accountHref}
              onClick={closeMobile}
              className="py-3 transition-colors hover:text-[var(--b)]"
            >
              {t('site.account')} · {displayName}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              onClick={closeMobile}
              className="py-3 transition-colors hover:text-[var(--b)]"
            >
              {t('site.signIn')}
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
