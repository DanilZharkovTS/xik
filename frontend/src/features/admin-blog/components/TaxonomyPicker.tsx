'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { TextField } from '@/src/shared/ui/text-field'
import { adminBlogService } from '../admin-blog.service'
import type { TaxonomyItem } from '../admin-blog.types'
import { slugify } from '../article-form'

type Props = {
  taxonomy: { categories: TaxonomyItem[]; tags: TaxonomyItem[] }
  selectedTags: string[]
  onToggleTag: (id: string) => void
  onCreatedTag: (tag: TaxonomyItem) => void
  onCreatedCategory: (category: TaxonomyItem) => void
}

// Теги вибираються чипами, нові рубрики й теги створюються тут же, не виходячи зі статті.
export function TaxonomyPicker({ taxonomy, selectedTags, onToggleTag, onCreatedTag, onCreatedCategory }: Props): ReactElement {
  const { t, locale } = useI18n()
  const [creating, setCreating] = useState<'tag' | 'category' | null>(null)

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--m)]">{t('blogAdmin.pub.tags')}</p>
      <div className="flex flex-wrap gap-2">
        {taxonomy.tags.map((tag) => {
          const isOn = selectedTags.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={isOn}
              onClick={() => onToggleTag(tag.id)}
              className={`min-h-9 rounded-full border px-3 text-sm transition-colors ${
                isOn ? 'border-[var(--t)] bg-[var(--t)] text-[var(--bg)]' : 'border-[var(--l)] text-[var(--m)] hover:border-[var(--t)]'
              }`}
            >
              #{(locale === 'uk' && tag.names.uk) || tag.names.en}
            </button>
          )
        })}
        <button type="button" onClick={() => setCreating(creating === 'tag' ? null : 'tag')} className="min-h-9 rounded-full border border-dashed border-[var(--l)] px-3 text-sm text-[var(--m)] hover:border-[var(--t)]">
          {t('blogAdmin.tax.newTag')}
        </button>
        <button type="button" onClick={() => setCreating(creating === 'category' ? null : 'category')} className="min-h-9 rounded-full border border-dashed border-[var(--l)] px-3 text-sm text-[var(--m)] hover:border-[var(--t)]">
          {t('blogAdmin.tax.newCategory')}
        </button>
      </div>

      {creating && (
        <NewTaxonomy
          kind={creating}
          onDone={(item) => {
            if (creating === 'tag') onCreatedTag(item)
            else onCreatedCategory(item)
            setCreating(null)
          }}
        />
      )}
    </div>
  )
}

function NewTaxonomy({ kind, onDone }: { kind: 'tag' | 'category'; onDone: (item: TaxonomyItem) => void }): ReactElement {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const [names, setNames] = useState({ en: '', es: '', uk: '' })
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const add = async () => {
    if (!token || !names.en.trim() || !slug.trim()) return

    const data = {
      slug: slug.trim(),
      names: {
        en: names.en.trim(),
        ...(names.es.trim() ? { es: names.es.trim() } : {}),
        ...(names.uk.trim() ? { uk: names.uk.trim() } : {}),
      },
    }

    try {
      setIsSaving(true)
      const item = kind === 'tag' ? await adminBlogService.createTag(data, token) : await adminBlogService.createCategory(data, token)
      toast.success(t('blogAdmin.tax.created'))
      onDone(item)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--l)] bg-[var(--s)] p-3">
      <TextField
        label={t('blogAdmin.tax.name')}
        maxLength={50}
        value={names.en}
        onChange={(e) => {
          setNames({ ...names, en: e.target.value })
          if (!slugTouched) setSlug(slugify(e.target.value).slice(0, 60))
        }}
      />
      <TextField label={t('blogAdmin.tax.nameEs')} maxLength={50} value={names.es} onChange={(e) => setNames({ ...names, es: e.target.value })} />
      <TextField label={t('blogAdmin.tax.nameUk')} maxLength={50} value={names.uk} onChange={(e) => setNames({ ...names, uk: e.target.value })} />
      <TextField
        label={t('blogAdmin.tax.slug')}
        maxLength={60}
        value={slug}
        onChange={(e) => {
          setSlugTouched(true)
          setSlug(e.target.value)
        }}
      />
      <Button onClick={add} disabled={isSaving || !names.en.trim() || !slug.trim()}>
        {t('blogAdmin.tax.add')}
      </Button>
    </div>
  )
}
