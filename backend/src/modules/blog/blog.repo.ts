import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../shared/database/prisma.js'
import type { ContentLocale } from '../products/product.constants.js'

const full = {
  translations: true,
  cover: true,
  category: true,
  tags: true,
  author: { select: { name: true } },
} satisfies Prisma.ArticleInclude

export type ArticleFull = Prisma.ArticleGetPayload<{ include: typeof full }>

// Видима на сайті: опублікована, дата настала, і є завершений переклад потрібною мовою.
export const visibleWhere = (lang: ContentLocale, now: Date): Prisma.ArticleWhereInput => ({
  status: 'published',
  publishedAt: { lte: now },
  translations: { some: { locale: lang, isReady: true } },
})

export const blogRepo = {
  findFull: (id: string): Promise<ArticleFull | null> =>
    prisma.article.findUnique({ where: { id }, include: full }),

  findByPreviewToken: (token: string): Promise<ArticleFull | null> =>
    prisma.article.findUnique({ where: { previewToken: token }, include: full }),

  findVisibleBySlug: (lang: ContentLocale, slug: string, now: Date): Promise<ArticleFull | null> =>
    prisma.article.findFirst({
      where: {
        ...visibleWhere(lang, now),
        translations: { some: { locale: lang, slug, isReady: true } },
      },
      include: full,
    }),

  listVisible: async (
    lang: ContentLocale,
    filter: { tag?: string; category?: string },
    page: number,
    limit: number,
    now: Date
  ) => {
    const where: Prisma.ArticleWhereInput = {
      ...visibleWhere(lang, now),
      ...(filter.tag ? { tags: { some: { slug: filter.tag } } } : {}),
      ...(filter.category ? { category: { slug: filter.category } } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: full,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return { items, total }
  },

  // Кандидати для "Читайте також": видимі статті зі спільними тегами (або будь-які, якщо тегів немає).
  listRelatedCandidates: (lang: ContentLocale, articleId: string, tagIds: string[], now: Date) =>
    prisma.article.findMany({
      where: {
        ...visibleWhere(lang, now),
        id: { not: articleId },
        ...(tagIds.length > 0 ? { tags: { some: { id: { in: tagIds } } } } : {}),
      },
      include: full,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: 30,
    }),

  listLatest: (lang: ContentLocale, excludeId: string, take: number, now: Date) =>
    prisma.article.findMany({
      where: { ...visibleWhere(lang, now), id: { not: excludeId } },
      include: full,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take,
    }),

  // Для sitemap і RSS: усі видимі статті з їхніми готовими перекладами.
  listAllVisible: (now: Date) =>
    prisma.article.findMany({
      where: { status: 'published', publishedAt: { lte: now } },
      include: full,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    }),

  listAdmin: (state: string, q?: string, now: Date = new Date()) => {
    const where: Prisma.ArticleWhereInput = {
      ...(state === 'draft' ? { status: 'draft' } : {}),
      ...(state === 'archived' ? { status: 'archived' } : {}),
      ...(state === 'published' ? { status: 'published', publishedAt: { lte: now } } : {}),
      ...(state === 'scheduled' ? { status: 'published', publishedAt: { gt: now } } : {}),
      ...(state === 'all' ? { status: { not: 'archived' as const } } : {}),
      ...(q ? { translations: { some: { title: { contains: q, mode: 'insensitive' as const } } } } : {}),
    }

    return prisma.article.findMany({
      where,
      include: full,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 200,
    })
  },

  categories: () => prisma.articleCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] }),
  tags: () => prisma.articleTag.findMany({ orderBy: { slug: 'asc' } }),

  // Рубрики й теги з кількістю видимих статей цією мовою: на сайті показуються лише непорожні.
  categoriesWithCounts: (lang: ContentLocale, now: Date) =>
    prisma.articleCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
      include: { _count: { select: { articles: { where: visibleWhere(lang, now) } } } },
    }),

  tagsWithCounts: (lang: ContentLocale, now: Date) =>
    prisma.articleTag.findMany({
      orderBy: { slug: 'asc' },
      include: { _count: { select: { articles: { where: visibleWhere(lang, now) } } } },
    }),

  assetsByIds: (ids: string[]) =>
    ids.length === 0 ? Promise.resolve([]) : prisma.mediaAsset.findMany({ where: { id: { in: ids } } }),

  productsByIds: (ids: string[]) =>
    ids.length === 0 ? Promise.resolve([]) : prisma.product.findMany({ where: { id: { in: ids } } }),
}
