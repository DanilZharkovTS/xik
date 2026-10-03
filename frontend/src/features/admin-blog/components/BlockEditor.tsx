'use client'

import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { ArrowDown, ArrowUp, Heading2, Image as ImageIcon, MousePointerClick, Package, Quote, Type, Video } from 'lucide-react'

import useAuthStore from '@/src/features/auth/store'
import { adminProductsService } from '@/src/features/admin-products/admin-products.service'
import type { AdminProduct } from '@/src/features/admin-products/admin-products.types'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import type { MessageKey } from '@/src/shared/i18n/messages'
import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { TextareaField } from '@/src/shared/ui/textarea-field'
import { TextField } from '@/src/shared/ui/text-field'
import type { AssetInfo, BlockType, EditorBlock } from '../admin-blog.types'
import { createBlock } from '../article-form'
import { ImageField } from './ImageField'

const TYPES: { type: BlockType; labelKey: MessageKey; Icon: typeof Type }[] = [
  { type: 'text', labelKey: 'blogAdmin.block.text', Icon: Type },
  { type: 'heading', labelKey: 'blogAdmin.block.heading', Icon: Heading2 },
  { type: 'image', labelKey: 'blogAdmin.block.image', Icon: ImageIcon },
  { type: 'video', labelKey: 'blogAdmin.block.video', Icon: Video },
  { type: 'quote', labelKey: 'blogAdmin.block.quote', Icon: Quote },
  { type: 'cta', labelKey: 'blogAdmin.block.cta', Icon: MousePointerClick },
  { type: 'product', labelKey: 'blogAdmin.block.product', Icon: Package },
]

// Лише підказка в редакторі; остаточно посилання перевіряє бекенд.
const VIDEO_HOSTS = /^https:\/\/((www|m)\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com|tiktok\.com|facebook\.com|fb\.watch|x\.com|twitter\.com)\//i

type BlockEditorProps = {
  blocks: EditorBlock[]
  assets: Record<string, AssetInfo>
  onChange: (blocks: EditorBlock[]) => void
  onAsset: (id: string, asset: AssetInfo) => void
}

export function BlockEditor({ blocks, assets, onChange, onAsset }: BlockEditorProps): ReactElement {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const [products, setProducts] = useState<AdminProduct[]>([])

  const hasProductBlock = blocks.some((block) => block.type === 'product')

  // Список продуктів потрібен лише тоді, коли в статті є блок продукту.
  useEffect(() => {
    if (!token || !hasProductBlock) return
    adminProductsService.list({ state: 'active' }, token).then(setProducts).catch(() => undefined)
  }, [token, hasProductBlock])

  const patch = (id: string, change: Partial<EditorBlock>) =>
    onChange(blocks.map((block) => (block.id === id ? ({ ...block, ...change } as EditorBlock) : block)))

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 && <p className="text-sm text-[var(--m)]">{t('blogAdmin.blocks.empty')}</p>}

      {blocks.map((block, index) => (
        <BlockCard
          key={block.id}
          block={block}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
          onUp={() => move(index, -1)}
          onDown={() => move(index, 1)}
          onDelete={() => onChange(blocks.filter((item) => item.id !== block.id))}
        >
          {block.type === 'text' && (
            <TextareaField
              label={t('blogAdmin.block.textLabel')}
              className="min-h-32"
              maxLength={6000}
              value={block.text}
              onChange={(e) => patch(block.id, { text: e.target.value })}
            />
          )}

          {block.type === 'heading' && (
            <>
              <SelectField
                label={t('blogAdmin.block.level')}
                value={String(block.level)}
                onChange={(e) => patch(block.id, { level: e.target.value === '3' ? 3 : 2 })}
              >
                <option value="2">{t('blogAdmin.block.h2')}</option>
                <option value="3">{t('blogAdmin.block.h3')}</option>
              </SelectField>
              <TextField
                label={t('blogAdmin.block.headingText')}
                maxLength={160}
                value={block.text}
                onChange={(e) => patch(block.id, { text: e.target.value })}
              />
            </>
          )}

          {block.type === 'image' && (
            <>
              <ImageField
                value={block.assetId && assets[block.assetId] ? { id: block.assetId, url: assets[block.assetId].url } : null}
                onChange={(asset) => {
                  if (asset) onAsset(asset.id, asset)
                  patch(block.id, { assetId: asset?.id ?? '' })
                }}
              />
              <TextField
                label={t('blogAdmin.block.alt')}
                maxLength={200}
                value={block.alt}
                onChange={(e) => patch(block.id, { alt: e.target.value })}
              />
              <TextField
                label={t('blogAdmin.block.caption')}
                maxLength={200}
                value={block.caption ?? ''}
                onChange={(e) => patch(block.id, { caption: e.target.value })}
              />
            </>
          )}

          {block.type === 'video' && (
            <>
              <TextField
                label={t('blogAdmin.block.videoUrl')}
                type="url"
                inputMode="url"
                maxLength={500}
                value={block.url}
                onChange={(e) => patch(block.id, { url: e.target.value })}
              />
              <p className={`text-sm ${block.url && !VIDEO_HOSTS.test(block.url.trim()) ? 'text-red-500' : 'text-[var(--m)]'}`}>
                {block.url && !VIDEO_HOSTS.test(block.url.trim())
                  ? t('blogAdmin.block.videoUnknown')
                  : t('blogAdmin.block.videoHint')}
              </p>
              <TextField
                label={t('blogAdmin.block.caption')}
                maxLength={200}
                value={block.caption ?? ''}
                onChange={(e) => patch(block.id, { caption: e.target.value })}
              />
            </>
          )}

          {block.type === 'quote' && (
            <>
              <TextareaField
                label={t('blogAdmin.block.quoteText')}
                maxLength={600}
                value={block.text}
                onChange={(e) => patch(block.id, { text: e.target.value })}
              />
              <TextField
                label={t('blogAdmin.block.quoteAuthor')}
                maxLength={100}
                value={block.author ?? ''}
                onChange={(e) => patch(block.id, { author: e.target.value })}
              />
            </>
          )}

          {block.type === 'cta' && (
            <>
              <TextField label={t('blogAdmin.block.ctaTitle')} maxLength={120} value={block.title} onChange={(e) => patch(block.id, { title: e.target.value })} />
              <TextareaField label={t('blogAdmin.block.ctaText')} maxLength={300} value={block.text ?? ''} onChange={(e) => patch(block.id, { text: e.target.value })} />
              <TextField label={t('blogAdmin.block.ctaButton')} maxLength={40} value={block.buttonLabel} onChange={(e) => patch(block.id, { buttonLabel: e.target.value })} />
              <TextField label={t('blogAdmin.block.ctaUrl')} maxLength={500} value={block.url} onChange={(e) => patch(block.id, { url: e.target.value })} />
            </>
          )}

          {block.type === 'product' && (
            <SelectField
              label={t('blogAdmin.block.productPick')}
              value={block.productId}
              onChange={(e) => patch(block.id, { productId: e.target.value })}
            >
              <option value="">{t('blogAdmin.block.productNone')}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </SelectField>
          )}
        </BlockCard>
      ))}

      <div role="group" aria-label={t('blogAdmin.blocks.add')} className="flex flex-wrap gap-2 pt-1">
        {TYPES.map(({ type, labelKey, Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange([...blocks, createBlock(type)])}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--l)] px-3.5 text-sm text-[var(--t)] transition-colors hover:border-[var(--t)]"
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}

function BlockCard({
  block,
  isFirst,
  isLast,
  onUp,
  onDown,
  onDelete,
  children,
}: {
  block: EditorBlock
  isFirst: boolean
  isLast: boolean
  onUp: () => void
  onDown: () => void
  onDelete: () => void
  children: ReactNode
}): ReactElement {
  const { t } = useI18n()
  // Видалення блока двокроковe: випадковий дотик на телефоні не губить написаний текст.
  const [isConfirming, setIsConfirming] = useState(false)
  const type = TYPES.find((item) => item.type === block.type)!

  return (
    <fieldset className="space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:p-4">
      <legend className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-[var(--m)]">
        <type.Icon className="h-3.5 w-3.5" />
        {t(type.labelKey)}
      </legend>

      {children}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" aria-label={t('blogAdmin.block.up')} disabled={isFirst} onClick={onUp}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button variant="secondary" aria-label={t('blogAdmin.block.down')} disabled={isLast} onClick={onDown}>
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          className={isConfirming ? 'border-red-500 text-red-500' : ''}
          onClick={() => (isConfirming ? onDelete() : setIsConfirming(true))}
          onBlur={() => setIsConfirming(false)}
        >
          {isConfirming ? t('blogAdmin.block.confirmDelete') : t('blogAdmin.block.delete')}
        </Button>
      </div>
    </fieldset>
  )
}
