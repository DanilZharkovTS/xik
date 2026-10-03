'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { Sheet } from '@/src/shared/ui/sheet'
import { adminBlogService } from '../admin-blog.service'
import type { Asset } from '../admin-blog.types'

const MAX_BYTES = 25 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type ImageFieldProps = {
  value: { id: string; url: string } | null
  onChange: (asset: Asset | null) => void
}

// Вибір зображення: нове завантаження або вже завантажене з бібліотеки.
export function ImageField({ value, onChange }: ImageFieldProps): ReactElement {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const input = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)

  const upload = async (file: File) => {
    if (!token) return

    // Те саме перевіряє бекенд; тут лише щоб не чекати відповіді на очевидну помилку.
    if (!TYPES.includes(file.type)) return void toast.error(t('blogAdmin.img.type'))
    if (file.size > MAX_BYTES) return void toast.error(t('blogAdmin.img.tooLarge'))

    try {
      setIsUploading(true)
      onChange(await adminBlogService.upload(file, token))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.url} alt="" className="max-h-48 w-full rounded-xl border border-[var(--l)] object-cover" />
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept={TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-label={t('blogAdmin.img.upload')}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Button variant="secondary" disabled={isUploading} onClick={() => input.current?.click()}>
          {isUploading ? t('blogAdmin.img.uploading') : t('blogAdmin.img.upload')}
        </Button>
        <Button variant="secondary" onClick={() => setIsLibraryOpen(true)}>
          {t('blogAdmin.img.library')}
        </Button>
        {value && (
          <Button variant="secondary" onClick={() => onChange(null)}>
            {t('blogAdmin.img.remove')}
          </Button>
        )}
      </div>

      <Library
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onPick={(asset) => {
          onChange(asset)
          setIsLibraryOpen(false)
        }}
      />
    </div>
  )
}

function Library({
  isOpen,
  onClose,
  onPick,
}: {
  isOpen: boolean
  onClose: () => void
  onPick: (asset: Asset) => void
}): ReactElement {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const [assets, setAssets] = useState<Asset[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen || !token) return
    let isCurrent = true

    adminBlogService
      .library(page, token)
      .then((result) => {
        if (!isCurrent) return
        setAssets((current) => (page === 1 ? result.assets : [...current, ...result.assets]))
        setPages(result.pages)
        setIsLoaded(true)
      })
      .catch((err) => toast.error(getErrorMessage(err)))

    return () => {
      isCurrent = false
    }
  }, [isOpen, page, token])

  return (
    <Sheet title={t('blogAdmin.img.libraryTitle')} isOpen={isOpen} onClose={onClose} size="lg">
      {isLoaded && assets.length === 0 ? (
        <p className="text-sm text-[var(--m)]">{t('blogAdmin.img.libraryEmpty')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {assets.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => onPick(asset)}
                className="block w-full overflow-hidden rounded-xl border border-[var(--l)] hover:border-[var(--t)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {page < pages && (
        <Button variant="secondary" className="mt-3 w-full" onClick={() => setPage((current) => current + 1)}>
          {t('blogAdmin.img.more')}
        </Button>
      )}
    </Sheet>
  )
}
