import type { Metadata } from 'next'

import { getAbsoluteUrl, siteConfig, siteText } from '@/src/config/site'
import { Welcome } from '@/src/features/home/components/Welcome'
import { localeFromParams } from '@/src/shared/i18n/server'
import { localizedPath } from '@/src/shared/i18n/paths'
import { JsonLd } from '@/src/shared/seo/json-ld'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

// Каталог живе в БД: сторінка збирається на кожен запит, не під час білду.
export const dynamic = 'force-dynamic'

type HomeProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const text = siteText(locale)

  return createPageMetadata({
    absoluteTitle: true,
    title: text.defaultTitle,
    description: text.description,
    pathname: '/',
    locale,
  })
}

export default async function Home({ params }: HomeProps): Promise<React.ReactElement> {
  const locale = await localeFromParams(params)
  const text = siteText(locale)

  const homeUrl = getAbsoluteUrl(localizedPath('/', locale))
  const blogUrl = getAbsoluteUrl(localizedPath('/blog', locale))

  return (
    <>
      <JsonLd
        id="website-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteConfig.name,
          url: homeUrl,
          description: text.description,
          inLanguage: locale,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${blogUrl}?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <JsonLd
        id="organization-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteConfig.name,
          url: homeUrl,
          logo: getAbsoluteUrl(siteConfig.logo),
          description: text.description,
          sameAs: [siteConfig.links.github, siteConfig.links.twitter].filter(Boolean),
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            url: `${homeUrl}#about`,
          },
        }}
      />
      <Welcome locale={locale} />
    </>
  )
}
