import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { notFound } from 'next/navigation'
import { siteConfig, siteText } from '@/src/config/site'
import { DEFAULT_LOCALE, LOCALES, isLocale } from '@/src/shared/i18n/i18n-store'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { LocaleProvider } from '@/src/shared/i18n/locale-provider'
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from '@/src/features/theme/theme-config'
import { MainLayout } from '@/src/layouts/site-header/MainLayout'

const themeInitializationScript = `
  (() => {
    const fallback = '${DEFAULT_THEME}';
    let theme = fallback;

    try {
      const stored = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      theme = stored === 'light' || stored === 'dark' ? stored : fallback;
    } catch {}

    document.documentElement.dataset.theme = theme;
  })();
`

export function generateStaticParams(): { locale: string }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const text = siteText(locale)

  return {
    metadataBase: new URL(siteConfig.origin),
    title: {
      default: text.defaultTitle,
      template: `%s | ${siteConfig.shortName}`,
    },
    description: text.description,
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name, url: siteConfig.origin }],
    creator: siteConfig.name,
    manifest: '/manifest.webmanifest',
  }
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!isLocale(locale)) notFound()

  return (
    <html
      lang={locale}
      className="min-h-full"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitializationScript,
          }}
          id="xik-theme-initializer"
          suppressHydrationWarning
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <LocaleProvider urlLocale={locale}>
          <MainLayout>{children}</MainLayout>
        </LocaleProvider>
      </body>
    </html>
  )
}

