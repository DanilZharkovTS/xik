import type { Metadata } from 'next'

import { siteConfig } from '@/src/config/site'
import { Welcome } from '@/src/features/home/components/Welcome'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

// Каталог живе в БД: сторінка збирається на кожен запит, не під час білду.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: true,
  title: siteConfig.defaultTitle,
  description: siteConfig.description,
  pathname: '/',
})

export default async function Home(): Promise<React.ReactElement> {
  return <Welcome />
}
