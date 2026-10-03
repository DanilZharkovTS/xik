import type { Locale } from '@/src/shared/i18n/i18n-store'
import type { Article, ArticleList, BlogTaxonomy, FeedArticle } from './blog.types'

// Той самий принцип, що в каталозі: адреса бекенду в Docker внутрішня, кеш з тегом скидається
// з бекенду після змін в адмінці. П'ять хвилин лишаються страховкою й точністю для запланованих статей.
const apiBase = (): string => {
  const base = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001'
  return `${base.replace(/\/$/, '')}/api/blog`
}

export const BLOG_TAG = 'blog'
const REVALIDATE_SECONDS = 300

const cached: RequestInit = { next: { revalidate: REVALIDATE_SECONDS, tags: [BLOG_TAG] } }

const empty: ArticleList = { articles: [], total: 0, page: 1, pages: 1 }

// Сторінки не повинні падати разом із бекендом: без даних блог просто порожній.
export async function fetchArticles(
  locale: Locale,
  options: { tag?: string; category?: string; page?: number; limit?: number } = {},
): Promise<ArticleList> {
  try {
    const query = new URLSearchParams({ lang: locale })
    if (options.tag) query.set('tag', options.tag)
    if (options.category) query.set('category', options.category)
    if (options.page) query.set('page', String(options.page))
    if (options.limit) query.set('limit', String(options.limit))

    const res = await fetch(`${apiBase()}/articles?${query}`, cached)

    if (!res.ok) {
      console.error(`Articles request failed: ${res.status}`)
      return empty
    }

    return (await res.json()) as ArticleList
  } catch (err) {
    console.error('Articles request failed:', err instanceof Error ? err.message : err)
    return empty
  }
}

export async function fetchBlogTaxonomy(locale: Locale): Promise<BlogTaxonomy> {
  try {
    const res = await fetch(`${apiBase()}/taxonomy?lang=${locale}`, cached)
    if (!res.ok) return { categories: [], tags: [] }
    return (await res.json()) as BlogTaxonomy
  } catch {
    return { categories: [], tags: [] }
  }
}

// null означає, що статті немає (404); збій бекенду кидає помилку, а не маскується під "не знайдено".
export async function fetchArticle(slug: string, locale: Locale): Promise<Article | null> {
  const res = await fetch(`${apiBase()}/articles/${encodeURIComponent(slug)}?lang=${locale}`, cached)

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Article request failed: ${res.status}`)

  return (await res.json()).article as Article
}

// Чернетка за секретним посиланням: без кешу, щоб правки було видно одразу.
export async function fetchPreview(token: string, locale: Locale): Promise<Article | null> {
  const res = await fetch(`${apiBase()}/preview/${encodeURIComponent(token)}?lang=${locale}`, { cache: 'no-store' })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Preview request failed: ${res.status}`)

  return (await res.json()).article as Article
}

export async function fetchFeed(): Promise<FeedArticle[]> {
  try {
    const res = await fetch(`${apiBase()}/feed`, cached)
    if (!res.ok) return []
    return (await res.json()).articles as FeedArticle[]
  } catch {
    return []
  }
}
