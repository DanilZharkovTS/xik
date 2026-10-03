import type { Metadata } from 'next'

import { siteConfig } from '@/src/config/site'

type CreatePageMetadataInput = {
  readonly absoluteTitle?: boolean
  readonly description: string
  // Адреса картки для соцмереж; без неї береться спільна.
  readonly image?: string
  readonly pathname: string
  readonly title: string
}

export function createPageMetadata({
  absoluteTitle = false,
  description,
  image = siteConfig.openGraphImage,
  pathname,
  title,
}: CreatePageMetadataInput): Metadata {
  const socialTitle = absoluteTitle
    ? title
    : `${title} | ${siteConfig.shortName}`

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: pathname,
      siteName: siteConfig.name,
      title: socialTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [
        {
          url: image,
          alt: title,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  }
}
