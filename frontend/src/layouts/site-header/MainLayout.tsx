'use client'

import { AppProvider } from '@/src/providers/AppProvider'
import { JsonLd } from '@/src/shared/seo/json-ld'
import { SiteHeader } from './site-header'
import { AdminHeader, AdminTabBar } from './admin-header'
import { ModernFooter } from '@/src/layouts/site-footer/modern-footer'
import { Toaster } from 'sonner'
import { siteConfig, siteText } from '@/src/config/site'
import useAuthStore from '@/src/features/auth/store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useI18nStore } from '@/src/shared/i18n/i18n-store'
import { splitLocale } from '@/src/shared/i18n/paths'
import { useI18n, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/src/features/theme/theme-config'

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const up = useUrlLocalePath()
  const initLocale = useI18nStore((state) => state.initLocale)

  // Збережену мову підставляємо один раз після гідрації (для входу й кабінету).
  useEffect(() => {
    initLocale()
  }, [initLocale])

  // Скрипт теми виконується лише при повному завантаженні. Після м'якого переходу (зміна мови)
  // <html> перебудовується без атрибута, тож тему повертаємо тут.
  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.theme) return

    let theme: string = DEFAULT_THEME
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') theme = stored
    } catch {}
    root.dataset.theme = theme
  })

  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)

  // Адреса без префікса мови: /es/products і /products однаково "/products".
  const { path } = splitLocale(pathname)

  useEffect(() => {
    if (!user && status === 'checking') return

    const isStaff = user?.role === 'admin' || user?.role === 'moderator'

    // Захист на клієнті: бекенд усе одно перевіряє кожен запит, тож тут лише зручність.
    // Гість не бачить робочих сторінок і кабінету, а залогінений не лишається на формі входу.
    const isPrivatePath =
      path.startsWith('/dashboard') ||
      path.startsWith('/outreach') ||
      path.startsWith('/admin') ||
      path.startsWith('/account')

    if (!user && isPrivatePath) {
      router.replace(up('/auth/login'))
      return
    }

    if (user && path.startsWith('/auth/')) {
      router.replace(up(isStaff ? '/dashboard' : '/account'))
      return
    }

    // Клієнт магазину працює в кабінеті, адмін і модератор у робочій зоні.
    if (user && !isStaff && (path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/outreach'))) {
      router.replace(up('/account'))
      return
    }

    if (user && isStaff && path.startsWith('/account')) {
      router.replace(up('/dashboard'))
      return
    }

    if (path.startsWith('/admin') && user?.role !== 'admin') {
      router.replace(up('/dashboard'))
    }
  }, [path, user, router, status, up])

  const isHome = path === '/'

  // Робоча зона для залогіненого адміна/модератора: своя шапка, без меню й футера сайту.
  const isWorkspace =
    (user?.role === 'admin' || user?.role === 'moderator') &&
    (path.startsWith('/admin') || path.startsWith('/outreach') || path.startsWith('/dashboard'))

  return (
    <>
      <a
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-[var(--t)] px-4 py-2 text-sm text-[var(--bg)] shadow-md transition-transform duration-200 focus-visible:translate-y-0"
        href="#main-content"
      >
        {t('site.skip')}
      </a>

      {isWorkspace ? <AdminHeader /> : <SiteHeader />}

      <main
        id="main-content"
        className={`flex-1 ${isWorkspace ? 'pt-[45px] max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pt-[52px]' : !isHome ? 'pt-[52px]' : ''}`}
        tabIndex={-1}
      >
        {children}
      </main>

      {isWorkspace && <AdminTabBar />}
      {!isWorkspace && <ModernFooter />}
      <Toaster richColors position="bottom-right" expand={false} />
    </>
  )
}

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { locale } = useI18n()
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.origin,
    description: siteText(locale).description,
    logo: `${siteConfig.origin}/icon.svg`,
  }

  return (
    <AppProvider>
      <JsonLd
        data={organizationStructuredData}
        id="organization-structured-data"
      />
      <MainContent>{children}</MainContent>
    </AppProvider>
  )
}
