'use client'

import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { withLocale } from '@/src/shared/i18n/paths'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { Segmented } from '@/src/shared/ui/segmented'
import { SelectField } from '@/src/shared/ui/select-field'
import { TextareaField } from '@/src/shared/ui/textarea-field'
import { TextField } from '@/src/shared/ui/text-field'
import { adminBlogService } from '../admin-blog.service'
import type { AdminArticle, AssetInfo, TaxonomyItem } from '../admin-blog.types'
import {
  CONTENT_LOCALES,
  cloneBlocks,
  isReady,
  isStarted,
  newForm,
  slugify,
  toForm,
  toPayload,
} from '../article-form'
import type { ArticleForm, TranslationForm } from '../article-form'
import { BlockEditor } from './BlockEditor'
import { ImageField } from './ImageField'
import { PreviewLink } from './PreviewLink'
import { TaxonomyPicker } from './TaxonomyPicker'

function Group({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-[var(--l)] p-3 md:p-4">
      <legend className="px-1 text-xs uppercase tracking-wider text-[var(--m)]">{title}</legend>
      {children}
    </fieldset>
  )
}

const counter = (value: string, max: number): string => `${value.length} / ${max}`

export function ArticleEditor({ articleId }: { articleId: string | null }): ReactElement {
  const { t, locale: uiLocale } = useI18n()
  const router = useRouter()
  const token = useAuthStore((state) => state.accessToken)

  const [article, setArticle] = useState<AdminArticle | null>(null)
  const [form, setForm] = useState<ArticleForm>(newForm)
  const [assets, setAssets] = useState<Record<string, AssetInfo>>({})
  const [taxonomy, setTaxonomy] = useState<{ categories: TaxonomyItem[]; tags: TaxonomyItem[] }>({ categories: [], tags: [] })
  const [lang, setLang] = useState<Locale>('en')
  const [isLoading, setIsLoading] = useState(articleId !== null)
  const [isSaving, setIsSaving] = useState(false)

  const apply = (loaded: AdminArticle) => {
    setArticle(loaded)
    setForm(toForm(loaded))
    setAssets((current) => ({ ...current, ...loaded.assets }))
  }

  useEffect(() => {
    if (!token) return
    let isCurrent = true

    adminBlogService.taxonomy(token).then((result) => isCurrent && setTaxonomy(result)).catch(() => undefined)

    if (articleId) {
      adminBlogService
        .get(articleId, token)
        .then((loaded) => isCurrent && apply(loaded))
        .catch(() => toast.error(t('blogAdmin.editor.loadFailed')))
        .finally(() => isCurrent && setIsLoading(false))
    }

    return () => {
      isCurrent = false
    }
    // t нестабільний між рендерами мови; завантаження залежить лише від статті й токена.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, token])

  const current = form.translations[lang]
  const isEnglish = lang === 'en'

  const patchTranslation = (change: Partial<TranslationForm>) =>
    setForm((state) => ({
      ...state,
      translations: { ...state.translations, [lang]: { ...state.translations[lang], ...change } },
    }))

  const setTitle = (title: string) =>
    patchTranslation({ title, ...(current.slugTouched ? {} : { slug: slugify(title) }) })

  const save = async () => {
    if (!token) return

    for (const code of CONTENT_LOCALES) {
      const value = form.translations[code]
      const required = code === 'en' || isStarted(value)
      if (required && !(value.title.trim() && value.slug.trim() && value.excerpt.trim())) {
        toast.error(
          code === 'en' && !isStarted(value)
            ? t('blogAdmin.err.needEnglish')
            : t('blogAdmin.err.needFields', { lang: t(`blogAdmin.lang.${code}` as 'blogAdmin.lang.en') }),
        )
        setLang(code)
        return
      }
    }

    const existing = (Object.keys(article?.translations ?? {}) as Locale[])
    const payload = toPayload(form, existing)

    try {
      setIsSaving(true)

      if (article) {
        apply(await adminBlogService.update(article.id, payload, token))
        toast.success(t('blogAdmin.editor.saved'))
      } else {
        const created = await adminBlogService.create(
          { ...payload, status: payload.status === 'archived' ? 'draft' : payload.status },
          token,
        )
        toast.success(t('blogAdmin.editor.created'))
        router.replace(`/admin/blog/${created.id}`)
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const copyBlocks = () => {
    patchTranslation({ blocks: cloneBlocks(form.translations.en.blocks) })
    toast.success(t('blogAdmin.lang.copied'))
  }

  if (isLoading) return <p className="p-4 text-sm text-[var(--m)]">{t('common.loading')}</p>

  const statusLabel = (code: Locale): string =>
    isReady(form.translations[code]) ? ' ✓' : isStarted(form.translations[code]) ? ' …' : ''

  const scheduled = form.status === 'published' && form.publishedAt !== '' && new Date(form.publishedAt) > new Date()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 md:py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/blog" className="text-sm text-[var(--m)] hover:text-[var(--t)]">
          ← {t('blogAdmin.editor.back')}
        </Link>
        <h1 className="text-lg font-medium md:text-2xl">
          {article ? t('blogAdmin.editor.edit') : t('blogAdmin.editor.new')}
        </h1>
      </div>

      <Group title={t('blogAdmin.pub.title')}>
        <SelectField
          label={t('blogAdmin.pub.status')}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as ArticleForm['status'] })}
        >
          <option value="draft">{t('blogAdmin.pub.status.draft')}</option>
          <option value="published">{t('blogAdmin.pub.status.published')}</option>
          {article && <option value="archived">{t('blogAdmin.pub.status.archived')}</option>}
        </SelectField>

        <TextField
          label={t('blogAdmin.pub.date')}
          type="datetime-local"
          value={form.publishedAt}
          onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
        />
        <p className="text-sm text-[var(--m)]">{scheduled ? t('blogAdmin.pub.scheduledFor') : t('blogAdmin.pub.dateHint')}</p>

        <SelectField
          label={t('blogAdmin.pub.category')}
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">{t('blogAdmin.pub.noCategory')}</option>
          {taxonomy.categories.map((item) => (
            <option key={item.id} value={item.id}>
              {(uiLocale === 'uk' && item.names.uk) || item.names.en}
            </option>
          ))}
        </SelectField>

        <TaxonomyPicker
          taxonomy={taxonomy}
          selectedTags={form.tagIds}
          onToggleTag={(id) =>
            setForm((state) => ({
              ...state,
              tagIds: state.tagIds.includes(id) ? state.tagIds.filter((tag) => tag !== id) : [...state.tagIds, id],
            }))
          }
          onCreatedTag={(tag) => {
            setTaxonomy((state) => ({ ...state, tags: [...state.tags, tag] }))
            setForm((state) => ({ ...state, tagIds: [...state.tagIds, tag.id] }))
          }}
          onCreatedCategory={(category) => {
            setTaxonomy((state) => ({ ...state, categories: [...state.categories, category] }))
            setForm((state) => ({ ...state, categoryId: category.id }))
          }}
        />

        <div className="space-y-1.5">
          <p className="text-sm text-[var(--m)]">{t('blogAdmin.pub.cover')}</p>
          <ImageField
            value={form.cover}
            onChange={(asset) => {
              if (asset) setAssets((state) => ({ ...state, [asset.id]: asset }))
              setForm({ ...form, cover: asset ? { id: asset.id, url: asset.url } : null })
            }}
          />
          <p className="text-sm text-[var(--m)]">{t('blogAdmin.pub.coverHint')}</p>
        </div>
      </Group>

      <Group title={t('blogAdmin.lang.title')}>
        <Segmented<Locale>
          label={t('blogAdmin.lang.title')}
          value={lang}
          onChange={setLang}
          options={CONTENT_LOCALES.map((code) => ({
            value: code,
            label: `${code.toUpperCase()}${statusLabel(code)}`,
          }))}
        />
        <p className="text-sm text-[var(--m)]">
          {isReady(current) ? t('blogAdmin.lang.live') : isStarted(current) ? t('blogAdmin.lang.incomplete') : ''}
          {!isEnglish && <span className="block">{t('blogAdmin.lang.hint')}</span>}
        </p>

        <TextField
          key={`title-${lang}`}
          label={t('blogAdmin.f.title')}
          required={isEnglish}
          maxLength={120}
          value={current.title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          key={`slug-${lang}`}
          label={t('blogAdmin.f.slug')}
          required={isEnglish}
          maxLength={90}
          value={current.slug}
          onChange={(e) => patchTranslation({ slug: e.target.value, slugTouched: true })}
        />
        <TextareaField
          key={`excerpt-${lang}`}
          label={t('blogAdmin.f.excerpt')}
          required={isEnglish}
          maxLength={300}
          value={current.excerpt}
          onChange={(e) => patchTranslation({ excerpt: e.target.value })}
        />
        <p className="text-sm text-[var(--m)]">
          {t('blogAdmin.f.excerptHint')} {counter(current.excerpt, 300)}
        </p>
        <TextField
          key={`coverAlt-${lang}`}
          label={t('blogAdmin.f.coverAlt')}
          maxLength={200}
          value={current.coverAlt}
          onChange={(e) => patchTranslation({ coverAlt: e.target.value })}
        />
      </Group>

      <Group title={t('blogAdmin.blocks.title')}>
        {!isEnglish && form.translations.en.blocks.length > 0 && current.blocks.length === 0 && (
          <Button variant="secondary" onClick={copyBlocks}>
            {t('blogAdmin.lang.copyStructure')}
          </Button>
        )}
        <BlockEditor
          key={lang}
          blocks={current.blocks}
          assets={assets}
          onChange={(blocks) => patchTranslation({ blocks })}
          onAsset={(id, asset) => setAssets((state) => ({ ...state, [id]: asset }))}
        />
      </Group>

      <Group title={t('blogAdmin.f.seo')}>
        <TextField
          key={`seoTitle-${lang}`}
          label={t('blogAdmin.f.seoTitle')}
          maxLength={70}
          value={current.seoTitle}
          onChange={(e) => patchTranslation({ seoTitle: e.target.value })}
        />
        <p className="text-sm text-[var(--m)]">{counter(current.seoTitle, 60)}</p>
        <TextareaField
          key={`seoDescription-${lang}`}
          label={t('blogAdmin.f.seoDescription')}
          maxLength={170}
          value={current.seoDescription}
          onChange={(e) => patchTranslation({ seoDescription: e.target.value })}
        />
        <p className="text-sm text-[var(--m)]">{counter(current.seoDescription, 160)}</p>
        <TextField
          key={`keywords-${lang}`}
          label={t('blogAdmin.f.keywords')}
          value={current.keywords}
          onChange={(e) => patchTranslation({ keywords: e.target.value })}
        />
      </Group>

      <PreviewLink
        article={article}
        onToken={(previewToken) => article && setArticle({ ...article, previewToken })}
        previewHref={(code) => (article ? withLocale(`/blog/preview/${article.previewToken}`, code) : null)}
      />

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-[var(--l)] bg-[var(--bg)] px-4 pb-1 pt-3 max-md:bottom-[calc(3.5rem+env(safe-area-inset-bottom))]">
        <Button className="flex-1" onClick={save} disabled={isSaving}>
          {isSaving ? t('blogAdmin.editor.saving') : t('blogAdmin.editor.save')}
        </Button>
      </div>
    </div>
  )
}
