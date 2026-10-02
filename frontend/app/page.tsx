import type { Metadata } from 'next'

import { siteConfig } from '@/src/config/site'
import { Welcome } from '@/src/features/home/components/Welcome'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: true,
  title: siteConfig.defaultTitle,
  description: siteConfig.description,
  pathname: '/',
})

export default async function Home(): Promise<React.ReactElement> {
  return <Welcome />
}
