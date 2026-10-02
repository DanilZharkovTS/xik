'use client'

import { AppProvider } from '@/src/providers/AppProvider'
import { JsonLd } from '@/src/shared/seo/json-ld'
import { SiteHeader } from './site-header'
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

    if (pathname.startsWith('/admin') && user?.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [pathname, user, router, status])

  const isHome = pathname === '/'

  return (
    <>
      <a
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-[var(--t)] px-4 py-2 text-sm text-[var(--bg)] shadow-md transition-transform duration-200 focus-visible:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main
        id="main-content"
        className={`flex-1 ${!isHome ? 'pt-[52px]' : ''}`}
        tabIndex={-1}
      >
        {children}
      </main>

      <ModernFooter />
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
