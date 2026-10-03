import { fetchProduct } from '@/src/features/catalog/catalog-api'
import { OG_SIZE, renderOgCard } from '@/src/shared/seo/og-card'
import { truncate } from '@/src/shared/seo/truncate'

export const alt = 'XIK ai agent'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await fetchProduct(slug)

  return renderOgCard({
    eyebrow: 'AI agent',
    title: product?.name ?? 'XIK',
    subtitle: truncate(product?.tagline ?? product?.shortDescription ?? 'AI tools with pixel soul', 110),
  })
}
