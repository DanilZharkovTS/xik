import type { Locale } from '@/src/shared/i18n/i18n-store'
import type {
  AdminArticle,
  ArticlePayload,
  EditorBlock,
  TranslationDto,
  TranslationPayload,
} from './admin-blog.types'

export const CONTENT_LOCALES: readonly Locale[] = ['en', 'es', 'uk']

export interface TranslationForm {
  slug: string
  slugTouched: boolean
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  keywords: string
  coverAlt: string
  blocks: EditorBlock[]
}

export interface ArticleForm {
  status: 'draft' | 'published' | 'archived'
  // Значення поля datetime-local (локальний час адміна) або порожньо.
  publishedAt: string
  cover: { id: string; url: string } | null
  categoryId: string
  tagIds: string[]
  translations: Record<Locale, TranslationForm>
}

export const EMPTY_TRANSLATION: TranslationForm = {
  slug: '',
  slugTouched: false,
  title: '',
  excerpt: '',
  seoTitle: '',
  seoDescription: '',
  keywords: '',
  coverAlt: '',
  blocks: [],
}

export const newForm = (): ArticleForm => ({
  status: 'draft',
  publishedAt: '',
  cover: null,
  categoryId: '',
  tagIds: [],
  translations: { en: EMPTY_TRANSLATION, es: EMPTY_TRANSLATION, uk: EMPTY_TRANSLATION },
})

const UK_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i',
  й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh',
  ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ъ: '',
}

// Адреса з назви: кирилиця транслітерується, діакритика (іспанська) знімається.
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[а-яіїєґыэъ]/g, (char) => UK_TO_LATIN[char] ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

export const newBlockId = (): string => Math.random().toString(36).slice(2, 12)

export const createBlock = (type: EditorBlock['type']): EditorBlock => {
  const id = newBlockId()
  switch (type) {
    case 'text': return { id, type, text: '' }
    case 'heading': return { id, type, level: 2, text: '' }
    case 'image': return { id, type, assetId: '', alt: '' }
    case 'video': return { id, type, url: '' }
    case 'quote': return { id, type, text: '' }
    case 'cta': return { id, type, title: '', buttonLabel: '', url: '' }
    case 'product': return { id, type, productId: '' }
  }
}

// Блоки нового мовного варіанта з англійських: структура готова, лишається перекласти тексти.
export const cloneBlocks = (blocks: EditorBlock[]): EditorBlock[] =>
  blocks.map((block) => ({ ...block, id: newBlockId() }))

const pad = (value: number): string => String(value).padStart(2, '0')

export const toLocalInput = (iso: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const fromLocalInput = (value: string): string | null =>
  value ? new Date(value).toISOString() : null

const translationToForm = (dto: TranslationDto | undefined): TranslationForm =>
  dto
    ? {
        slug: dto.slug,
        slugTouched: true,
        title: dto.title,
        excerpt: dto.excerpt,
        seoTitle: dto.seoTitle ?? '',
        seoDescription: dto.seoDescription ?? '',
        keywords: dto.keywords.join(', '),
        coverAlt: dto.coverAlt ?? '',
        blocks: dto.blocks,
      }
    : EMPTY_TRANSLATION

export const toForm = (article: AdminArticle): ArticleForm => ({
  status: article.status,
  publishedAt: toLocalInput(article.publishedAt),
  cover: article.cover ? { id: article.cover.id, url: article.cover.url } : null,
  categoryId: article.categoryId ?? '',
  tagIds: article.tagIds,
  translations: {
    en: translationToForm(article.translations.en),
    es: translationToForm(article.translations.es),
    uk: translationToForm(article.translations.uk),
  },
})

// Мовний варіант "розпочато", якщо в ньому щось заповнено: порожній не надсилається взагалі.
export const isStarted = (form: TranslationForm): boolean =>
  Boolean(form.title.trim() || form.slug.trim() || form.excerpt.trim() || form.blocks.length > 0)

export const isReady = (form: TranslationForm): boolean =>
  Boolean(form.title.trim() && form.slug.trim() && form.excerpt.trim() && form.blocks.length > 0)

const emptyToUndefined = (value: string | undefined): string | undefined => value?.trim() || undefined

// Порожні необов'язкові поля блоків прибираються, бо бекенд вимагає непорожні рядки.
const cleanBlock = (block: EditorBlock): EditorBlock => {
  switch (block.type) {
    case 'image': return { ...block, caption: emptyToUndefined(block.caption) }
    case 'video': return { ...block, caption: emptyToUndefined(block.caption) }
    case 'quote': return { ...block, author: emptyToUndefined(block.author) }
    case 'cta': return { ...block, text: emptyToUndefined(block.text) }
    default: return block
  }
}

const translationPayload = (form: TranslationForm): TranslationPayload => ({
  slug: form.slug.trim(),
  title: form.title.trim(),
  excerpt: form.excerpt.trim(),
  seoTitle: form.seoTitle.trim() || null,
  seoDescription: form.seoDescription.trim() || null,
  keywords: form.keywords.split(',').map((item) => item.trim()).filter(Boolean),
  coverAlt: form.coverAlt.trim() || null,
  blocks: form.blocks.map(cleanBlock),
})

// existing: мови, що вже є в збереженій статті. Порожню з них треба видалити (null), нову порожню пропустити.
export const toPayload = (form: ArticleForm, existing: Locale[]): ArticlePayload => {
  const translations: ArticlePayload['translations'] = { en: translationPayload(form.translations.en) }

  for (const locale of ['es', 'uk'] as const) {
    const value = form.translations[locale]
    if (isStarted(value)) translations[locale] = translationPayload(value)
    else if (existing.includes(locale)) translations[locale] = null
  }

  return {
    status: form.status,
    publishedAt: fromLocalInput(form.publishedAt),
    coverAssetId: form.cover?.id ?? null,
    categoryId: form.categoryId || null,
    tagIds: form.tagIds,
    translations,
  }
}
