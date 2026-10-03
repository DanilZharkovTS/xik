import { getCatalogItem } from '@/src/features/catalog/data/catalog-items'
import { OG_SIZE, renderOgCard } from '@/src/shared/seo/og-card'
import { truncate } from '@/src/shared/seo/truncate'

export const alt = 'XIK engineering service'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getCatalogItem(slug)

  return renderOgCard({
    eyebrow: 'Engineering service',
    title: item?.title ?? 'XIK',
    subtitle: truncate(item?.tagline ?? item?.subtitle ?? 'AI tools with pixel soul', 110),
  })
}
