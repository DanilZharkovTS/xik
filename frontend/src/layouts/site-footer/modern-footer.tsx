import React from 'react'
import Link from 'next/link'

export function ModernFooter() {
  return (
    <footer className="border-t border-[var(--l)] px-6 py-9 text-[13px] text-[var(--m)] transition-colors">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <b className="font-bold text-[var(--t)]">XIK.APP</b>
          <span>Products · Services · Autonomous AI · 2026</span>
        </div>

        <nav className="flex items-center gap-6 text-xs">
          <Link href="/#products" className="transition-colors hover:text-[var(--t)]">
            Products
          </Link>
          <Link href="/#ai" className="transition-colors hover:text-[var(--t)]">
            AI
          </Link>
          <Link href="/#services" className="transition-colors hover:text-[var(--t)]">
            Services
          </Link>
          <Link href="/#about" className="transition-colors hover:text-[var(--t)]">
            About
          </Link>
        </nav>
      </div>
    </footer>
  )
}
