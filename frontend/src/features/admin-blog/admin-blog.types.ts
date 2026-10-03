import type { Locale } from '@/src/shared/i18n/i18n-store'

export type ArticleState = 'draft' | 'published' | 'scheduled' | 'archived'

export interface AdminArticleRow {
  id: string
  status: 'draft' | 'published' | 'archived'
  state: ArticleState
  publishedAt: string | null
  updatedAt: string
  title: string
  cover: { url: string } | null
  category: { name: string } | null
  locales: Locale[]
}

// Блок так, як його зберігає бекенд (зображення за assetId, відео за посиланням).
export type EditorBlock =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'heading'; level: 2 | 3; text: string }
  | { id: string; type: 'image'; assetId: string; alt: string; caption?: string }
  | { id: string; type: 'video'; url: string; caption?: string }
  | { id: string; type: 'quote'; text: string; author?: string }
  | { id: string; type: 'cta'; title: string; text?: string; buttonLabel: string; url: string }
  | { id: string; type: 'product'; productId: string }

export type BlockType = EditorBlock['type']

export interface TranslationDto {
  slug: string
  title: string
  excerpt: string
  seoTitle: string | null
  seoDescription: string | null
  keywords: string[]
  coverAlt: string | null
  blocks: EditorBlock[]
  isReady: boolean
}

export interface AssetInfo {
  url: string
  width: number
  height: number
}

export interface AdminArticle {
  id: string
  status: 'draft' | 'published' | 'archived'
  state: ArticleState
  publishedAt: string | null
  previewToken: string
  cover: (AssetInfo & { id: string }) | null
  categoryId: string | null
  tagIds: string[]
  translations: Partial<Record<Locale, TranslationDto>>
  assets: Record<string, AssetInfo>
}

export interface TaxonomyItem {
  id: string
  slug: string
  names: { en: string; es?: string; uk?: string }
}

export interface Asset extends AssetInfo {
  id: string
  mime: string
  size: number
}

export interface TranslationPayload {
  slug: string
  title: string
  excerpt: string
  seoTitle: string | null
  seoDescription: string | null
  keywords: string[]
  coverAlt: string | null
  blocks: EditorBlock[]
}

export interface ArticlePayload {
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  coverAssetId: string | null
  categoryId: string | null
  tagIds: string[]
  translations: { en: TranslationPayload; es?: TranslationPayload | null; uk?: TranslationPayload | null }
}
