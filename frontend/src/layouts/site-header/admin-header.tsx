'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { authService } from '@/src/features/auth/auth.service'
import useAuthStore from '@/src/features/auth/store'
import { ThemeToggle } from '@/src/features/theme/components/theme-toggle'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { BookOpen, House, Newspaper, Package, UserCog, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/src/shared/lib/cn'
import { LanguageSwitch } from '@/src/shared/i18n/language-switch'
import { useI18n, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'
import type { MessageKey } from '@/src/shared/i18n/messages'

type NavItem = { href: string; labelKey: MessageKey; match: string; Icon: LucideIcon; adminOnly?: boolean; tabOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  // Лише в нижній панелі на телефоні: на десктопі на дашборд веде лого.
  { href: '/dashboard', labelKey: 'nav.home', match: '/dashboard', Icon: House, tabOnly: true },
  { href: '/outreach/check', labelKey: 'nav.journal', match: '/outreach', Icon: BookOpen },
  { href: '/admin/team', labelKey: 'nav.team', match: '/admin/team', Icon: Users, adminOnly: true },
  { href: '/admin/products', labelKey: 'nav.products', match: '/admin/products', Icon: Package, adminOnly: true },
  { href: '/admin/blog', labelKey: 'nav.blog', match: '/admin/blog', Icon: Newspaper, adminOnly: true },
  { href: '/admin/users', labelKey: 'nav.users', match: '/admin/users', Icon: UserCog, adminOnly: true },
]

// Шапка робочої зони (адмін і модератор): замість меню сайту. Навігація на телефоні
// окремим рядком, що гортається, щоб пункти лишалися великими й під рукою.
export function useWorkspaceNav(): NavItem[] {
  const role = useAuthStore((state) => state.user?.role)
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === 'admin')
}

export function AdminHeader() {
  const { t } = useI18n()
  const up = useUrlLocalePath()
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isAdmin = user?.role === 'admin'
  const items = useWorkspaceNav().filter((item) => !item.tabOnly)

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      await authService.logout()
      clearAuth()
      router.push(up('/auth/login'))
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
          className="shrink-0 whitespace-nowrap text-[19px] font-[750] tracking-tight text-[var(--t)]"
        >
          XIK<span aria-hidden="true" className="logo-cursor">_</span>
          <span className="ml-2 text-xs font-medium text-[var(--m)]">
            {isAdmin ? t('nav.admin') : t('nav.journal')}
          </span>
        </Link>

        <nav aria-label={t('nav.main')} className="ml-4 hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <HeaderLink key={item.href} item={item} pathname={pathname} label={t(item.labelKey)} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="hidden min-h-9 items-center rounded-full px-3 text-sm text-[var(--m)] hover:text-[var(--t)] sm:inline-flex"
          >
            {t('nav.viewSite')}
          </Link>
          <LanguageSwitch />
          <ThemeToggle />
          <span
            title={user?.email}
            className="hidden max-w-[10rem] truncate text-sm text-[var(--m)] lg:inline"
          >
            {user?.name?.trim() || user?.email.split('@')[0]}
          </span>
          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            className="min-h-8 rounded-full border border-[var(--l)] px-3.5 text-sm font-medium text-[var(--t)] hover:bg-[var(--s)] disabled:opacity-50"
          >
            {isLoggingOut ? t('nav.signingOut') : t('nav.logout')}
          </button>
        </div>
      </div>

    </header>
  )
}

function HeaderLink({ item, pathname, label }: { item: NavItem; pathname: string; label: string }) {
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
      {label}
    </Link>
  )
}

// Головне меню на телефоні внизу, як у мобільному застосунку.
export function AdminTabBar() {
  const { t } = useI18n()
  const pathname = usePathname()
  const items = useWorkspaceNav()

  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-[var(--l)] bg-[var(--bg)] pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ href, labelKey, match, Icon }) => {
        const isActive = pathname.startsWith(match)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium',
              isActive ? 'text-[var(--t)]' : 'text-[var(--m)]',
            )}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
            {t(labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
