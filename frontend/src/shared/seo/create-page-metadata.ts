import type { Metadata } from 'next'

import { siteConfig } from '@/src/config/site'

type CreatePageMetadataInput = {
  readonly absoluteTitle?: boolean
  readonly description: string
  readonly pathname: string
  readonly title: string
}

export function createPageMetadata({
  absoluteTitle = false,
  description,
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
          url: siteConfig.openGraphImage,
          width: 1200,
          height: 630,
          alt: siteConfig.openGraphImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [
        {
          url: siteConfig.openGraphImage,
          alt: siteConfig.openGraphImageAlt,
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
