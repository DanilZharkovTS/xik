import { randomUUID } from 'node:crypto'
import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import type { ContentLocale } from '../products/product.constants.js'
import type { Product } from '../products/products.types.js'
import { collectAssetIds, collectProductIds, readingMinutes } from './blog.blocks.js'
import type { Block } from './blog.blocks.js'
import { resolveBlocks, toTaxonomyAdminDto, toTaxonomyDto } from './blog.mapper.js'
import type { AssetRow } from './blog.mapper.js'
import { blogRepo } from './blog.repo.js'
import type { ArticleFull } from './blog.repo.js'
import type {
  AdminListDto,
  CreateArticleDto,
  PublicListDto,
  TaxonomyDto,
  TaxonomyUpdateDto,
  TranslationInput,
  UpdateArticleDto,
} from './blog.schema.js'

const LOCALES: ContentLocale[] = ['en', 'es', 'uk']

type TranslationRow = ArticleFull['translations'][number]

// ---------- допоміжне ----------

const isReady = (input: { title: string; excerpt: string; blocks: unknown[] }): boolean =>
  input.title.trim() !== '' && input.excerpt.trim() !== '' && input.blocks.length > 0

const translationData = (input: TranslationInput) => ({
  slug: input.slug,
  title: input.title,
  excerpt: input.excerpt,
  seoTitle: input.seoTitle || null,
  seoDescription: input.seoDescription || null,
  keywords: input.keywords,
  coverAlt: input.coverAlt || null,
  blocks: input.blocks as unknown as Prisma.InputJsonValue,
  readingMinutes: readingMinutes(input.blocks),
  isReady: isReady(input),
})

const translationOf = (article: ArticleFull, lang: ContentLocale): TranslationRow | undefined =>
  article.translations.find((item) => item.locale === lang)

const blocksOf = (translation: TranslationRow): Block[] => (translation.blocks ?? []) as Block[]

// Слаги в адресі різні в кожній мові, тож мовний перемикач потребує слагів усіх готових перекладів.
const alternatesOf = (article: ArticleFull): Partial<Record<ContentLocale, string>> =>
  Object.fromEntries(article.translations.filter((item) => item.isReady).map((item) => [item.locale, item.slug]))

const loadResources = async (translations: TranslationRow[]) => {
  const blocks = translations.flatMap(blocksOf)
  const [assets, products] = await Promise.all([
    blogRepo.assetsByIds(collectAssetIds(blocks)),
    blogRepo.productsByIds(collectProductIds(blocks)),
  ])

  return {
    assets: new Map<string, AssetRow>(assets.map((asset) => [asset.id, asset])),
    products: new Map<string, Product>((products as unknown as Product[]).map((product) => [product.id, product])),
  }
}

const slugTaken = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError &&
  err.code === 'P2002' &&
  JSON.stringify(err.meta ?? {}).includes('slug')

const toCard = (article: ArticleFull, lang: ContentLocale) => {
  const translation = translationOf(article, lang)!

  return {
    id: article.id,
    slug: translation.slug,
    locale: lang,
    title: translation.title,
    excerpt: translation.excerpt,
    readingMinutes: translation.readingMinutes,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    cover: article.cover
      ? { url: article.cover.url, width: article.cover.width, height: article.cover.height, alt: translation.coverAlt ?? translation.title }
      : null,
    category: article.category ? toTaxonomyDto(article.category, lang) : null,
    tags: article.tags.map((tag) => toTaxonomyDto(tag, lang)),
  }
}

// ---------- публічне ----------

const toPublicArticle = async (article: ArticleFull, lang: ContentLocale, isPreview: boolean) => {
  const translation = translationOf(article, lang)!
  const { assets, products } = await loadResources([translation])
  const now = new Date()

  let related: ArticleFull[] = []

  if (!isPreview) {
    const tagIds = article.tags.map((tag) => tag.id)
    const candidates = await blogRepo.listRelatedCandidates(lang, article.id, tagIds, now)

    // Спільні теги важать більше за свіжість; недобір добирається найновішими статтями.
    const shared = (candidate: ArticleFull) => candidate.tags.filter((tag) => tagIds.includes(tag.id)).length
    related = [...candidates].sort((a, b) => shared(b) - shared(a)).slice(0, 3)

    if (related.length < 3) {
      const latest = await blogRepo.listLatest(lang, article.id, 6, now)
      for (const item of latest) {
        if (related.length >= 3) break
        if (!related.some((existing) => existing.id === item.id)) related.push(item)
      }
    }
  }

  return {
    ...toCard(article, lang),
    seoTitle: translation.seoTitle,
    seoDescription: translation.seoDescription,
    keywords: translation.keywords,
    blocks: resolveBlocks(blocksOf(translation), assets, products, lang),
    alternates: alternatesOf(article),
    related: related.map((item) => toCard(item, lang)),
    isPreview,
  }
}

export const blogService = {
  listPublic: async (query: PublicListDto) => {
    const { items, total } = await blogRepo.listVisible(query.lang, { tag: query.tag, category: query.category }, query.page, query.limit, new Date())

    return {
      response: {
        articles: items.map((item) => toCard(item, query.lang)),
        total,
        page: query.page,
        pages: Math.max(1, Math.ceil(total / query.limit)),
      },
    }
  },

  getPublic: async (slug: string, lang: ContentLocale) => {
    const article = await blogRepo.findVisibleBySlug(lang, slug, new Date())

    if (!article) throw ApiError(404, 'ARTICLE_NOT_FOUND', 'Article not found')

    return { response: { article: await toPublicArticle(article, lang, false) } }
  },

  getPreview: async (token: string, lang: ContentLocale) => {
    const article = await blogRepo.findByPreviewToken(token)
    const translation = article ? translationOf(article, lang) : undefined

    if (!article || !translation) throw ApiError(404, 'ARTICLE_NOT_FOUND', 'Article not found')

    return { response: { article: await toPublicArticle(article, lang, true) } }
  },

  taxonomy: async (lang: ContentLocale) => {
    const now = new Date()
    const [categories, tags] = await Promise.all([
      blogRepo.categoriesWithCounts(lang, now),
      blogRepo.tagsWithCounts(lang, now),
    ])

    return {
      response: {
        categories: categories.filter((row) => row._count.articles > 0).map((row) => ({ ...toTaxonomyDto(row, lang), count: row._count.articles })),
        tags: tags.filter((row) => row._count.articles > 0).map((row) => ({ ...toTaxonomyDto(row, lang), count: row._count.articles })),
      },
    }
  },

  // Для sitemap і RSS: слаги й дати всіх видимих статей усіма готовими мовами.
  feed: async () => {
    const articles = await blogRepo.listAllVisible(new Date())

    return {
      response: {
        articles: articles.map((article) => ({
          id: article.id,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          cover: article.cover ? { url: article.cover.url } : null,
          translations: article.translations
            .filter((item) => item.isReady)
            .map((item) => ({ locale: item.locale, slug: item.slug, title: item.title, excerpt: item.excerpt, updatedAt: item.updatedAt })),
        })),
      },
    }
  },

  // ---------- адмінка ----------

  listAdmin: async (query: AdminListDto) => {
    const articles = await blogRepo.listAdmin(query.state, query.q)
    const now = new Date()

    return {
      response: {
        articles: articles.map((article) => {
          const en = translationOf(article, 'en')

          return {
            id: article.id,
            status: article.status,
            // Планування обчислюється: опубліковано, але дата ще не настала.
            state: stateOf(article, now),
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
            title: en?.title ?? '',
            cover: article.cover ? { url: article.cover.url } : null,
            category: article.category ? toTaxonomyDto(article.category, 'en') : null,
            locales: LOCALES.filter((locale) => translationOf(article, locale)?.isReady),
          }
        }),
      },
    }
  },

  getAdmin: async (id: string) => {
    const article = await blogRepo.findFull(id)
    if (!article) throw ApiError(404, 'ARTICLE_NOT_FOUND', 'Article not found')

    return { response: { article: await toAdminArticle(article) } }
  },

  create: async (user: TokenPayload, data: CreateArticleDto) => {
    await assertReferences(data)
    const publishedAt = resolvePublishedAt(data.status, data.publishedAt, null)

    if (data.status === 'published') assertPublishable(data.translations.en)

    try {
      const created = await prisma.article.create({
        data: {
          status: data.status,
          publishedAt,
          authorId: user.id,
          coverAssetId: data.coverAssetId ?? null,
          categoryId: data.categoryId ?? null,
          tags: { connect: data.tagIds.map((id) => ({ id })) },
          translations: {
            create: LOCALES.flatMap((locale) => {
              const input = data.translations[locale]
              return input ? [{ locale, ...translationData(input) }] : []
            }),
          },
        },
      })

      return blogService.getAdmin(created.id)
    } catch (err) {
      if (slugTaken(err)) throw ApiError(409, 'ARTICLE_SLUG_TAKEN', 'This slug is already used in this language')
      throw err
    }
  },

  update: async (id: string, data: UpdateArticleDto) => {
    const existing = await blogRepo.findFull(id)
    if (!existing) throw ApiError(404, 'ARTICLE_NOT_FOUND', 'Article not found')

    await assertReferences(data)

    const status = data.status ?? existing.status
    const publishedAt = resolvePublishedAt(status, data.publishedAt, existing.publishedAt)

    // Англійський переклад після оновлення: нова версія або наявна.
    const en = data.translations?.en ?? toInputFromRow(translationOf(existing, 'en'))
    if (status === 'published') assertPublishable(en)

    try {
      await prisma.$transaction(async (tx) => {
        await tx.article.update({
          where: { id },
          data: {
            status,
            publishedAt,
            ...(data.coverAssetId !== undefined ? { coverAssetId: data.coverAssetId } : {}),
            ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
            ...(data.tagIds ? { tags: { set: data.tagIds.map((tagId) => ({ id: tagId })) } } : {}),
          },
        })

        for (const locale of LOCALES) {
          const input = data.translations?.[locale]
          if (input === undefined) continue

          if (input === null) {
            await tx.articleTranslation.deleteMany({ where: { articleId: id, locale } })
            continue
          }

          await tx.articleTranslation.upsert({
            where: { articleId_locale: { articleId: id, locale } },
            create: { articleId: id, locale, ...translationData(input) },
            update: translationData(input),
          })
        }
      })
    } catch (err) {
      if (slugTaken(err)) throw ApiError(409, 'ARTICLE_SLUG_TAKEN', 'This slug is already used in this language')
      throw err
    }

    return blogService.getAdmin(id)
  },

  rotatePreviewToken: async (id: string) => {
    const article = await prisma.article.findUnique({ where: { id }, select: { id: true } })
    if (!article) throw ApiError(404, 'ARTICLE_NOT_FOUND', 'Article not found')

    const updated = await prisma.article.update({
      where: { id },
      data: { previewToken: randomUUID() },
      select: { previewToken: true },
    })

    return { response: { previewToken: updated.previewToken } }
  },

  // ---------- рубрики й теги ----------

  listTaxonomyAdmin: async () => {
    const [categories, tags] = await Promise.all([blogRepo.categories(), blogRepo.tags()])

    return {
      response: {
        categories: categories.map(toTaxonomyAdminDto),
        tags: tags.map(toTaxonomyAdminDto),
      },
    }
  },

  createCategory: async (data: TaxonomyDto) => {
    try {
      const row = await prisma.articleCategory.create({ data: { slug: data.slug, names: data.names } })
      return { response: { category: toTaxonomyAdminDto(row) } }
    } catch (err) {
      throw taxonomyError(err)
    }
  },

  updateCategory: async (id: string, data: TaxonomyUpdateDto) => {
    try {
      const row = await prisma.articleCategory.update({ where: { id }, data })
      return { response: { category: toTaxonomyAdminDto(row) } }
    } catch (err) {
      throw taxonomyError(err)
    }
  },

  deleteCategory: async (id: string) => {
    try {
      await prisma.articleCategory.delete({ where: { id } })
      return { response: { deleted: true } }
    } catch (err) {
      throw taxonomyError(err)
    }
  },

  createTag: async (data: TaxonomyDto) => {
    try {
      const row = await prisma.articleTag.create({ data: { slug: data.slug, names: data.names } })
      return { response: { tag: toTaxonomyAdminDto(row) } }
    } catch (err) {
      throw taxonomyError(err)
    }
  },

  updateTag: async (id: string, data: TaxonomyUpdateDto) => {
    try {
      const row = await prisma.articleTag.update({ where: { id }, data })
      return { response: { tag: toTaxonomyAdminDto(row) } }
    } catch (err) {
      throw taxonomyError(err)
    }
  },

  deleteTag: async (id: string) => {
    try {
      await prisma.articleTag.delete({ where: { id } })
      return { response: { deleted: true } }
    } catch (err) {
      throw taxonomyError(err)
    }
  },
}

// ---------- правила й перевірки ----------

const stateOf = (article: { status: string; publishedAt: Date | null }, now: Date) =>
  article.status === 'published' && article.publishedAt && article.publishedAt > now ? 'scheduled' : article.status

// Публікація без дати означає "зараз". Чернетка зберігає дату як заплановану на майбутнє.
const resolvePublishedAt = (
  status: string,
  provided: Date | null | undefined,
  current: Date | null
): Date | null => {
  const value = provided === undefined ? current : provided

  if (status === 'published') return value ?? new Date()

  return value
}

const assertPublishable = (en: { title: string; excerpt: string; blocks: unknown[] } | null | undefined): void => {
  if (!en || !isReady(en)) {
    throw ApiError(400, 'ARTICLE_NOT_PUBLISHABLE', 'The English version needs a title, an excerpt and at least one block to be published')
  }
}

const toInputFromRow = (row: TranslationRow | undefined) =>
  row ? { title: row.title, excerpt: row.excerpt, blocks: blocksOf(row) } : null

const taxonomyError = (err: unknown) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return ApiError(409, 'SLUG_TAKEN', 'This slug is already used')
    if (err.code === 'P2025') return ApiError(404, 'NOT_FOUND', 'Not found')
  }

  return err
}

// Усі посилання з тіла запиту (обкладинка, рубрика, теги, зображення й продукти в блоках) мають існувати.
const assertReferences = async (
  data: {
    coverAssetId?: string | null
    categoryId?: string | null
    tagIds?: string[]
    translations?: Partial<Record<ContentLocale, { blocks: Block[] } | null | undefined>>
  }
): Promise<void> => {
  const blocks = LOCALES.flatMap((locale) => data.translations?.[locale]?.blocks ?? [])
  const assetIds = [...new Set([...collectAssetIds(blocks), ...(data.coverAssetId ? [data.coverAssetId] : [])])]
  const productIds = collectProductIds(blocks)
  const tagIds = data.tagIds ?? []

  const [assets, products, category, tags] = await Promise.all([
    assetIds.length ? prisma.mediaAsset.count({ where: { id: { in: assetIds } } }) : 0,
    productIds.length ? prisma.product.count({ where: { id: { in: productIds } } }) : 0,
    data.categoryId ? prisma.articleCategory.count({ where: { id: data.categoryId } }) : 1,
    tagIds.length ? prisma.articleTag.count({ where: { id: { in: tagIds } } }) : 0,
  ])

  if (assets !== assetIds.length) throw ApiError(400, 'INVALID_REFERENCE', 'An image does not exist')
  if (products !== productIds.length) throw ApiError(400, 'INVALID_REFERENCE', 'A product does not exist')
  if (!category) throw ApiError(400, 'INVALID_REFERENCE', 'The category does not exist')
  if (tags !== new Set(tagIds).size) throw ApiError(400, 'INVALID_REFERENCE', 'A tag does not exist')
}

const toAdminArticle = async (article: ArticleFull) => {
  const { assets } = await loadResources(article.translations)
  const now = new Date()

  return {
    id: article.id,
    status: article.status,
    state: stateOf(article, now),
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    previewToken: article.previewToken,
    cover: article.cover
      ? { id: article.cover.id, url: article.cover.url, width: article.cover.width, height: article.cover.height }
      : null,
    categoryId: article.categoryId,
    tagIds: article.tags.map((tag) => tag.id),
    translations: Object.fromEntries(
      article.translations.map((item) => [
        item.locale,
        {
          slug: item.slug,
          title: item.title,
          excerpt: item.excerpt,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          keywords: item.keywords,
          coverAlt: item.coverAlt,
          blocks: item.blocks,
          readingMinutes: item.readingMinutes,
          isReady: item.isReady,
        },
      ])
    ),
    // Для прев'ю зображень у редакторі: id -> адреса й розміри.
    assets: Object.fromEntries([...assets.values()].map((asset) => [asset.id, { url: asset.url, width: asset.width, height: asset.height }])),
  }
}
