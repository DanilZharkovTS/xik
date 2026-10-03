import type { ApiCatalogProduct } from '@/src/features/catalog/catalog.types'
import type { Locale } from '@/src/shared/i18n/i18n-store'

// Відповіді публічного API блогу (бекенд: /api/blog/*).
export interface Taxonomy {
  id: string
  slug: string
  name: string
}

export interface ArticleCover {
  url: string
  width: number
  height: number
  alt: string
}

export interface ArticleCard {
  id: string
  slug: string
  locale: Locale
  title: string
  excerpt: string
  readingMinutes: number
  publishedAt: string | null
  updatedAt: string
  cover: ArticleCover | null
  category: Taxonomy | null
  tags: Taxonomy[]
}

export type VideoProvider = 'youtube' | 'vimeo' | 'tiktok' | 'facebook' | 'x'

export type PublicBlock =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'heading'; level: 2 | 3; text: string }
  | { id: string; type: 'image'; url: string; width: number; height: number; alt: string; caption: string | null }
  | {
      id: string
      type: 'video'
      provider: VideoProvider
      embedUrl: string
      watchUrl: string
      thumbnail: string | null
      aspect: 'landscape' | 'portrait'
      caption: string | null
    }
  | { id: string; type: 'quote'; text: string; author?: string }
  | { id: string; type: 'cta'; title: string; text?: string; buttonLabel: string; url: string }
  | { id: string; type: 'product'; product: ApiCatalogProduct }

export interface Article extends ArticleCard {
  seoTitle: string | null
  seoDescription: string | null
  keywords: string[]
  blocks: PublicBlock[]
  // slug статті в кожній мові, де є готовий переклад.
  alternates: Partial<Record<Locale, string>>
  related: ArticleCard[]
  isPreview: boolean
}

export interface ArticleList {
  articles: ArticleCard[]
  total: number
  page: number
  pages: number
}

export interface BlogTaxonomy {
  categories: (Taxonomy & { count: number })[]
  tags: (Taxonomy & { count: number })[]
}

export interface FeedArticle {
  id: string
  publishedAt: string
  updatedAt: string
  cover: { url: string } | null
  translations: { locale: Locale; slug: string; title: string; excerpt: string; updatedAt: string }[]
}
