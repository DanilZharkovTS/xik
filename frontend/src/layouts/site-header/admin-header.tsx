'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { authService } from '@/src/features/auth/auth.service'
import useAuthStore from '@/src/features/auth/store'
import { ThemeToggle } from '@/src/features/theme/components/theme-toggle'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { cn } from '@/src/shared/lib/cn'

type NavItem = { href: string; label: string; match: string; adminOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { href: '/outreach/check', label: 'Journal', match: '/outreach' },
  { href: '/admin/team', label: 'Team', match: '/admin/team', adminOnly: true },
  { href: '/admin/products', label: 'Products', match: '/admin/products', adminOnly: true },
  { href: '/admin/users', label: 'Users', match: '/admin/users', adminOnly: true },
]

// Шапка робочої зони (адмін і модератор): замість меню сайту. Навігація на телефоні
// окремим рядком, що гортається, щоб пункти лишалися великими й під рукою.
export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isAdmin = user?.role === 'admin'
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      await authService.logout()
      clearAuth()
      router.push('/auth/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--l)] bg-[var(--g)] backdrop-blur-xl">
      <div className="mx-auto flex h-11 w-full max-w-7xl md:h-[52px] items-center gap-3 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="text-[19px] font-[750] tracking-tight text-[var(--t)]"
        >
          XIK_
          <span className="ml-2 text-xs font-medium text-[var(--m)]">
            {isAdmin ? 'Admin' : 'Journal'}
          </span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <HeaderLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="hidden min-h-9 items-center rounded-full px-3 text-sm text-[var(--m)] hover:text-[var(--t)] sm:inline-flex"
          >
            View site
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            className="min-h-8 rounded-full border border-[var(--l)] px-3.5 text-sm font-medium text-[var(--t)] hover:bg-[var(--s)] disabled:opacity-50"
          >
            {isLoggingOut ? '...' : 'Log out'}
          </button>
        </div>
      </div>

      {/* У модератора один пункт, окремий рядок меню не потрібен. */}
      <nav
        aria-label="Main"
        hidden={items.length < 2}
        className={`${items.length < 2 ? 'hidden' : 'flex'} gap-1 overflow-x-auto border-t border-[var(--l)] px-3 py-0.5 [scrollbar-width:none] md:!hidden`}
      >
        {items.map((item) => (
          <HeaderLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </header>
  )
}

function HeaderLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname.startsWith(item.match)

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-sm md:min-h-9 md:px-4 font-medium transition-colors',
        isActive
          ? 'bg-[var(--t)] text-[var(--bg)]'
          : 'text-[var(--m)] hover:text-[var(--t)]',
      )}
    >
      {item.label}
    </Link>
  )
}
