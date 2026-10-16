'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useAuthStore from '@/src/features/auth/store'
import { ThemeToggle } from '@/src/features/theme/components/theme-toggle'
import { LanguageSwitch } from '@/src/shared/i18n/language-switch'
import { splitLocale } from '@/src/shared/i18n/paths'
import { useI18n, useLocalePath, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'

export function ModernSiteHeader() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const up = useUrlLocalePath()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileDialog = useRef<HTMLDialogElement>(null)
  const menuTrigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = mobileDialog.current
    if (!dialog || !mobileOpen) return
    const trigger = menuTrigger.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('button')?.focus()
    const media = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => { if (media.matches) dialog.close() }
    media.addEventListener('change', closeOnDesktop)
    return () => {
      media.removeEventListener('change', closeOnDesktop)
      dialog.close()
      document.body.style.overflow = overflow
      trigger?.focus()
    }
  }, [mobileOpen])
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
      <header className="fixed inset-x-0 top-0 z-50 h-[52px] border-b border-[var(--l)]/80 bg-[var(--bg)]/80 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-full max-w-[1180px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
          <Link
            href={lp('/')}
            className="mr-auto shrink-0 whitespace-nowrap text-[19px] font-[750] tracking-tight text-[var(--t)] transition-opacity hover:opacity-80"
          >
            XIK<span aria-hidden="true" className="logo-cursor">_</span>
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
                href={up(accountHref)}
                title={`${displayName} · ${user.email}`}
                aria-label={`${t('site.account')}: ${displayName}`}
                className="max-w-[9rem] truncate rounded-full bg-[var(--t)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] transition-opacity hover:opacity-90"
              >
                {displayName}
              </Link>
            ) : (
              <Link
                href={up('/login')}
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
              ref={menuTrigger}
              aria-controls="mobile-navigation"
              aria-expanded={mobileOpen}
              aria-label={t('site.menu.open')}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <dialog
        ref={mobileDialog}
        id="mobile-navigation"
        aria-label={t('site.nav.primary')}
        onClose={() => setMobileOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const items = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]')
          const first = items[0]
          const last = items[items.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
        className="fixed inset-x-0 top-[52px] m-0 max-h-[calc(100dvh-52px)] max-w-none w-full overflow-auto border-b border-[var(--l)] bg-[var(--bg)] px-6 py-6 text-[var(--t)] backdrop:bg-black/40 md:hidden"
      >
        <button type="button" onClick={closeMobile} aria-label={t('site.menu.close')} className="ml-auto block rounded-lg border border-[var(--l)] px-3 py-2">✕</button>
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
              href={up(accountHref)}
              onClick={closeMobile}
              className="py-3 transition-colors hover:text-[var(--b)]"
            >
              {t('site.account')} · {displayName}
            </Link>
          ) : (
            <Link
              href={up('/login')}
              onClick={closeMobile}
              className="py-3 transition-colors hover:text-[var(--b)]"
            >
              {t('site.signIn')}
            </Link>
          )}
        </div>
      </dialog>
    </>
  )
}
