import type { ContentLocale } from '../products/product.constants.js'
import { toCatalogDto } from '../products/products.mapper.js'
import type { Product } from '../products/products.types.js'
import { parseVideoUrl } from './blog.video.js'
import type { ParsedVideo } from './blog.video.js'
import type { Block } from './blog.blocks.js'

export interface AssetRow {
  id: string
  url: string
  width: number
  height: number
}

export interface TaxonomyRow {
  id: string
  slug: string
  names: unknown
}

export const localizedName = (names: unknown, lang: ContentLocale): string => {
  const map = (names ?? {}) as Partial<Record<ContentLocale, string>>
  return map[lang]?.trim() || map.en || ''
}

export const toTaxonomyDto = (row: TaxonomyRow, lang: ContentLocale) => ({
  id: row.id,
  slug: row.slug,
  name: localizedName(row.names, lang),
})

export const toTaxonomyAdminDto = (row: TaxonomyRow & { sortOrder?: number }) => ({
  id: row.id,
  slug: row.slug,
  names: row.names as Record<string, string>,
  ...(row.sortOrder !== undefined ? { sortOrder: row.sortOrder } : {}),
})

export type PublicBlock =
  | Exclude<Block, { type: 'image' | 'video' | 'product' }>
  | { id: string; type: 'image'; url: string; width: number; height: number; alt: string; caption: string | null }
  | ({ id: string; type: 'video'; caption: string | null } & ParsedVideo)
  | { id: string; type: 'product'; product: ReturnType<typeof toCatalogDto> }

// Блоки для сайту: посилання на зображення й продукти замінюються готовими даними,
// а відео розкладається на адресу вбудовування. Невалідне або видалене тихо випадає.
export const resolveBlocks = (
  blocks: Block[],
  assets: Map<string, AssetRow>,
  products: Map<string, Product>,
  lang: ContentLocale
): PublicBlock[] =>
  blocks.flatMap((block): PublicBlock[] => {
    switch (block.type) {
      case 'image': {
        const asset = assets.get(block.assetId)
        return asset
          ? [{ id: block.id, type: 'image' as const, url: asset.url, width: asset.width, height: asset.height, alt: block.alt, caption: block.caption ?? null }]
          : []
      }
      case 'video': {
        const video = parseVideoUrl(block.url)
        return video ? [{ id: block.id, type: 'video' as const, caption: block.caption ?? null, ...video }] : []
      }
      case 'product': {
        const product = products.get(block.productId)
        return product && !product.archivedAt
          ? [{ id: block.id, type: 'product' as const, product: toCatalogDto(product, lang) }]
          : []
      }
      default:
        return [block]
    }
  })
