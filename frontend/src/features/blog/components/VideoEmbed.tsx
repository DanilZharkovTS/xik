'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { Play } from 'lucide-react'

import { cn } from '@/src/shared/lib/cn'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import type { PublicBlock } from '../blog.types'

type VideoBlock = Extract<PublicBlock, { type: 'video' }>

const PROVIDER_NAME: Record<VideoBlock['provider'], string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  x: 'X',
}

// Фасад: до кліку сторінка не завантажує нічого стороннього (швидкість, приватність).
// iframe створюється лише після натискання, а під відео завжди є звичайне посилання на оригінал.
export function VideoEmbed({ block }: { block: VideoBlock }): ReactElement {
  const { t } = useI18n()
  const [isLoaded, setIsLoaded] = useState(false)
  const provider = PROVIDER_NAME[block.provider]
  const isPortrait = block.aspect === 'portrait'

  // Автозапуск лише там, де майданчик його підтримує параметром.
  const src =
    block.provider === 'youtube' || block.provider === 'vimeo'
      ? `${block.embedUrl}${block.embedUrl.includes('?') ? '&' : '?'}autoplay=1`
      : block.embedUrl

  return (
    <figure className={cn('my-8', isPortrait && 'mx-auto max-w-sm')}>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[var(--l)] bg-[var(--s)]',
          isPortrait ? 'aspect-[9/16]' : 'aspect-video',
        )}
      >
        {isLoaded ? (
          <iframe
            src={src}
            title={block.caption ?? provider}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsLoaded(true)}
            aria-label={t('blog.video.play', { provider })}
            className="group absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-[var(--t)]"
          >
            {block.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/25" aria-hidden="true" />
            <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--t)] text-[var(--bg)] shadow-xl transition-transform group-hover:scale-105">
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            </span>
            <span className="relative rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {provider}
            </span>
          </button>
        )}
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-[var(--m)]">
        {block.caption && <span>{block.caption}</span>}
        <a href={block.watchUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--t)]">
          {t('blog.video.watch', { provider })}
        </a>
        {!isLoaded && <span className="w-full text-xs">{t('blog.video.consent', { provider })}</span>}
      </figcaption>
    </figure>
  )
}
