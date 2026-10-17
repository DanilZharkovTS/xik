import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { siteConfig, siteText } from '@/src/config/site'
import { LOCALES, isLocale } from '@/src/shared/i18n/i18n-store'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { LocaleProvider } from '@/src/shared/i18n/locale-provider'
import {
  DEFAULT_THEME_PREFERENCE,
  SYSTEM_DARK_QUERY,
  THEME_STORAGE_KEY,
} from '@/src/features/theme/theme-config'
import { MainLayout } from '@/src/layouts/site-header/MainLayout'

// Виставляє тему до першого малювання і стежить за системною темою, коли обрано «Авто».
const themeInitializationScript = `
  (() => {
    const root = document.documentElement;
    const fallback = '${DEFAULT_THEME_PREFERENCE}';
    let preference = fallback;

    try {
      const stored = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      if (stored === 'light' || stored === 'dark' || stored === 'system') preference = stored;
    } catch {}

    const media = window.matchMedia ? window.matchMedia('${SYSTEM_DARK_QUERY}') : null;
    const resolve = (value) => value === 'system' ? (media && !media.matches ? 'light' : 'dark') : value;

    root.dataset.themePreference = preference;
    root.dataset.theme = resolve(preference);

    if (media && media.addEventListener) {
      media.addEventListener('change', () => {
        if (root.dataset.themePreference !== 'system') return;
        const theme = resolve('system');
        root.dataset.theme = theme;
        document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
          meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#000000');
        });
        window.dispatchEvent(new Event('xik-theme-change'));
      });
    }
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
  if (!isLocale(raw)) notFound()
  const locale: Locale = raw
  const text = siteText(locale)

  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION
  const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION

  const verification: NonNullable<Metadata['verification']> = {}
  if (googleVerification) verification.google = googleVerification
  if (yandexVerification) verification.yandex = yandexVerification
  if (bingVerification) verification.other = { 'msvalidate.01': bingVerification }

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
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
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
      <body className="flex min-h-dvh flex-col">
        {/* Тема виставляється до першого малювання, щоб не було спалаху; next/script робить це без попередження React. */}
        <Script
          id="xik-theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
        <LocaleProvider urlLocale={locale}>
          <MainLayout>{children}</MainLayout>
        </LocaleProvider>
      </body>
    </html>
  )
}

