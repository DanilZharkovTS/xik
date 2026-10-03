'use client'

import { AppProvider } from '@/src/providers/AppProvider'
import { JsonLd } from '@/src/shared/seo/json-ld'
import { SiteHeader } from './site-header'
import { AdminHeader, AdminTabBar } from './admin-header'
import { ModernFooter } from '@/src/layouts/site-footer/modern-footer'
import { Toaster } from 'sonner'
import { siteConfig } from '@/src/config/site'
import useAuthStore from '@/src/features/auth/store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const router = useRouter()

  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    if (!user && status === 'checking') return

    // Захист на клієнті: бекенд усе одно перевіряє кожен запит, тож тут лише зручність.
    // Гість не бачить робочих сторінок, а залогінений не лишається на формі входу.
    const isWorkspacePath =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/outreach') ||
      pathname.startsWith('/admin')

    if (!user && isWorkspacePath) {
      router.replace('/auth/login')
      return
    }

    if (user && pathname.startsWith('/auth/')) {
      router.replace('/dashboard')
      return
    }

    if (pathname.startsWith('/admin') && user?.role !== 'admin') {
      router.replace('/dashboard')
    }

    // Журнал для модераторів і адмінів; покупець магазину туди не потрапляє.
    if (
      pathname.startsWith('/outreach') &&
      user?.role !== 'admin' &&
      user?.role !== 'moderator'
    ) {
      router.replace('/dashboard')
    }
  }, [pathname, user, router, status])

  const isHome = pathname === '/'

  // Робоча зона для залогіненого адміна/модератора: своя шапка, без меню й футера сайту.
  const isWorkspace =
    (user?.role === 'admin' || user?.role === 'moderator') &&
    (pathname.startsWith('/admin') ||
      pathname.startsWith('/outreach') ||
      pathname.startsWith('/dashboard'))

  return (
    <>
      <a
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-[var(--t)] px-4 py-2 text-sm text-[var(--bg)] shadow-md transition-transform duration-200 focus-visible:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>

      {isWorkspace ? <AdminHeader /> : <SiteHeader />}

      <main
        id="main-content"
        className={`flex-1 ${isWorkspace ? `pt-[45px] md:pt-[52px] ${user?.role === 'admin' ? 'max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]' : ''}` : !isHome ? 'pt-[52px]' : ''}`}
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
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.origin,
    description: siteConfig.description,
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
