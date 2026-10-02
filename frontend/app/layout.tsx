import type { Metadata, Viewport } from 'next'
import './globals.css'
import { siteConfig } from '@/src/config/site'
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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: siteConfig.defaultTitle,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.origin,
    },
  ],
  creator: siteConfig.name,
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: siteConfig.name,
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.openGraphImage,
        width: 1200,
        height: 630,
        alt: siteConfig.openGraphImageAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.openGraphImage,
        alt: siteConfig.openGraphImageAlt,
      },
    ],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
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
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}

