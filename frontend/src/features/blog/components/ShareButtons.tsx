'use client'

import { useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'
import { Link2, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { useI18n } from '@/src/shared/i18n/use-i18n'

const BUTTON =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--l)] px-3.5 text-sm font-medium text-[var(--t)] transition-colors hover:border-[var(--t)]'

// Звичайні посилання на форми шерингу: без сторонніх скриптів і трекерів.
export function ShareButtons({ url, title }: { url: string; title: string }): ReactElement {
  const { t } = useI18n()
  // Web Share є лише в браузері (на сервері false), тож розбіжності гідрації немає.
  const canNativeShare = useSyncExternalStore(
    () => () => undefined,
    () => typeof navigator.share === 'function',
    () => false,
  )

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(title)

  const targets = [
    { name: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('blog.share.copied'))
    } catch {
      toast.error(url)
    }
  }

  return (
    <div role="group" aria-label={t('blog.share')} className="flex flex-wrap gap-2">
      {canNativeShare && (
        <button
          type="button"
          className={BUTTON}
          onClick={() => navigator.share({ url, title }).catch(() => undefined)}
        >
          <Share2 className="h-4 w-4" />
          {t('blog.share.native')}
        </button>
      )}
      {targets.map((target) => (
        <a key={target.name} href={target.href} target="_blank" rel="noopener noreferrer" className={BUTTON}>
          {target.name}
        </a>
      ))}
      <button type="button" className={BUTTON} onClick={copy}>
        <Link2 className="h-4 w-4" />
        {t('blog.share.copy')}
      </button>
    </div>
  )
}
