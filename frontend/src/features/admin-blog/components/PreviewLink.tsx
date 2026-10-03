'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { adminBlogService } from '../admin-blog.service'
import type { AdminArticle } from '../admin-blog.types'

// Секретне посилання на чернетку для кожної мови; новий токен робить старе посилання недійсним.
export function PreviewLink({
  article,
  onToken,
  previewHref,
}: {
  article: AdminArticle | null
  onToken: (token: string) => void
  previewHref: (locale: Locale) => string | null
}): ReactElement {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const [isBusy, setIsBusy] = useState(false)

  if (!article) {
    return (
      <fieldset className="rounded-2xl border border-[var(--l)] p-3 md:p-4">
        <legend className="px-1 text-xs uppercase tracking-wider text-[var(--m)]">{t('blogAdmin.preview.title')}</legend>
        <p className="text-sm text-[var(--m)]">{t('blogAdmin.preview.saveFirst')}</p>
      </fieldset>
    )
  }

  const copy = async (locale: Locale) => {
    const href = previewHref(locale)
    if (!href) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${href}`)
      toast.success(t('blogAdmin.preview.copied'))
    } catch {
      toast.error(`${window.location.origin}${href}`)
    }
  }

  const regenerate = async () => {
    if (!token) return
    try {
      setIsBusy(true)
      onToken(await adminBlogService.rotatePreview(article.id, token))
      toast.success(t('blogAdmin.preview.regenerated'))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <fieldset className="space-y-3 rounded-2xl border border-[var(--l)] p-3 md:p-4">
      <legend className="px-1 text-xs uppercase tracking-wider text-[var(--m)]">{t('blogAdmin.preview.title')}</legend>
      <p className="text-sm text-[var(--m)]">{t('blogAdmin.preview.hint')}</p>

      <ul className="space-y-2">
        {(['en', 'es', 'uk'] as const)
          .filter((code) => article.translations[code])
          .map((code) => (
            <li key={code} className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{code.toUpperCase()}</span>
              <span className="flex gap-2">
                <a
                  href={previewHref(code) ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center rounded-full border border-[var(--l)] px-4 text-sm hover:border-[var(--t)]"
                >
                  {t('blogAdmin.preview.open')}
                </a>
                <Button variant="secondary" onClick={() => copy(code)}>
                  {t('blogAdmin.preview.copy')}
                </Button>
              </span>
            </li>
          ))}
      </ul>

      <Button variant="secondary" className="w-full" disabled={isBusy} onClick={regenerate}>
        {t('blogAdmin.preview.regenerate')}
      </Button>
    </fieldset>
  )
}
