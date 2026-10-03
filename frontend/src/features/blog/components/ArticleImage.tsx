'use client'

import { useRef } from 'react'
import type { ReactElement } from 'react'
import { X } from 'lucide-react'

import { useI18n } from '@/src/shared/i18n/use-i18n'

type ArticleImageProps = {
  url: string
  width: number
  height: number
  alt: string
  caption: string | null
}

// Зображення в тексті; натискання відкриває його на весь екран (рідний <dialog>: Esc і фокус працюють самі).
export function ArticleImage({ url, width, height, alt, caption }: ArticleImageProps): ReactElement {
  const { t } = useI18n()
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <figure className="my-8 lg:-mx-12">
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={t('blog.image.zoom', { alt })}
        className="block w-full cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="h-auto w-full rounded-2xl border border-[var(--l)]"
        />
      </button>
      {caption && <figcaption className="mt-2 text-center text-sm text-[var(--m)]">{caption}</figcaption>}

      <dialog
        ref={dialog}
        aria-label={alt}
        // Натискання на тло (сам <dialog>) закриває вікно.
        onClick={(event) => event.target === dialog.current && dialog.current.close()}
        className="m-auto max-h-[95vh] max-w-[95vw] overflow-visible bg-transparent p-0 backdrop:bg-black/85"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain" />
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={t('common.close')}
          className="absolute -top-3 right-0 inline-flex h-10 w-10 -translate-y-full items-center justify-center rounded-full bg-[var(--bg)] text-[var(--t)] shadow-lg sm:right-0"
        >
          <X className="h-5 w-5" />
        </button>
      </dialog>
    </figure>
  )
}
