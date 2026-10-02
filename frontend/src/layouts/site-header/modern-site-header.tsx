'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useAuthStore from '@/src/features/auth/store'
import { ThemeToggle } from '@/src/features/theme/components/theme-toggle'

export function ModernSiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  const user = useAuthStore((state) => state.user)

  const navLinks = [
    { label: 'Products', href: isHome ? '#products' : '/#products' },
    { label: 'AI', href: isHome ? '#ai' : '/#ai' },
    { label: 'Services', href: isHome ? '#services' : '/#services' },
    { label: 'About', href: isHome ? '#about' : '/#about' },
  ]

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[52px] border-b border-[var(--l)] bg-[var(--g)] backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-full max-w-[1180px] items-center gap-5 px-6">
          <Link
            href="/"
            className="mr-auto text-[19px] font-[750] tracking-tight text-[var(--t)] transition-opacity hover:opacity-80"
          >
            XIK_
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-[var(--m)] md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-[var(--t)]"
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <Link
                href="/dashboard"
                className="transition-colors hover:text-[var(--t)]"
              >
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-[var(--t)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] transition-opacity hover:opacity-90"
              >
                Account
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-full border border-[var(--l)] px-3.5 py-1.5 text-xs font-medium text-[var(--t)] transition-colors hover:bg-[var(--s)]"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--l)] text-[var(--t)] md:hidden"
              aria-label="Toggle navigation"
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
              href="/dashboard"
              onClick={closeMobile}
              className="py-3 transition-colors hover:text-[var(--b)]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/login"
              onClick={closeMobile}
              className="py-3 transition-colors hover:text-[var(--b)]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
