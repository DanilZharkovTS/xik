import type { Metadata } from 'next'

import { getAbsoluteUrl, siteConfig, siteText } from '@/src/config/site'
import { DEFAULT_LOCALE, LOCALES } from '@/src/shared/i18n/i18n-store'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { localizedPath } from '@/src/shared/i18n/paths'

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', es: 'es_ES', uk: 'uk_UA' }

type CreatePageMetadataInput = {
  readonly absoluteTitle?: boolean
  readonly description: string
  // Адреса сторінки без префікса мови, наприклад "/products/keyho".
  readonly pathname: string
  readonly title: string
  readonly locale?: Locale
  // Мови, де сторінка має власний переклад: лише вони потрапляють у hreflang. Решта показують
  // англійський текст, тому закриті від індексу, щоб не плодити дублікати.
  readonly availableLocales?: readonly Locale[]
  // Адреса сторінки в кожній мові, коли вона різна (slug статті); решта беруть pathname.
  readonly alternatePaths?: Partial<Record<Locale, string>>
  // Адреса картки для соцмереж без префікса мови; без неї береться спільна.
  readonly image?: string
}

export function createPageMetadata({
  absoluteTitle = false,
  description,
  image = siteConfig.openGraphImage,
  locale = DEFAULT_LOCALE,
  availableLocales = LOCALES,
  alternatePaths,
  pathname,
  title,
}: CreatePageMetadataInput): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${siteConfig.shortName}`
  const pathFor = (code: Locale): string => alternatePaths?.[code] ?? pathname
  const canonical = localizedPath(pathFor(locale), locale)
  const isIndexable = availableLocales.includes(locale)

  // hreflang: кожна мова вказує на всі свої версії плюс x-default на англійську.
  const languages: Record<string, string> = {}
  for (const code of availableLocales) {
    languages[code] = getAbsoluteUrl(localizedPath(pathFor(code), code))
  }
  if (availableLocales.includes(DEFAULT_LOCALE)) {
    languages['x-default'] = getAbsoluteUrl(localizedPath(pathFor(DEFAULT_LOCALE), DEFAULT_LOCALE))
  }

  const imageUrl = image.startsWith('/') && locale !== DEFAULT_LOCALE && image !== siteConfig.openGraphImage
    ? `/${locale}${image}`
    : image
  const imageAlt = absoluteTitle ? siteText(locale).imageAlt : title

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE[locale],
      alternateLocale: availableLocales.filter((code) => code !== locale).map((code) => OG_LOCALE[code]),
      url: canonical,
      siteName: siteConfig.name,
      title: socialTitle,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
    robots: isIndexable
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : { index: false, follow: true },
  }
}
