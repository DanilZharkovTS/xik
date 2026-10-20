'use client'

import { useId, useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Key, Loader2 } from 'lucide-react'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { ModalAlert } from '@/src/shared/ui/modal-alert'
import { accountService } from '../account.service'
import type { LibraryItem } from '../account.service'

export type GetLicenseKeyProps = {
  item?: LibraryItem
  subscriptionId?: string
  onLicenseKeyReceived?: (libraryItem: LibraryItem) => void
  onModalClose?: () => void
  className?: string
  variant?: 'primary' | 'secondary'
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback below
    }
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch {
    return false
  }
}

export function GetLicenseKey({
  item,
  subscriptionId,
  onLicenseKeyReceived,
  onModalClose,
  className,
  variant = 'secondary',
}: GetLicenseKeyProps): ReactElement {
  const { t } = useI18n()
  const inputId = useId()
  const token = useAuthStore((state) => state.accessToken)

  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [licenseKey, setLicenseKey] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const targetId = subscriptionId || item?.id

  const handleGetKey = async () => {
    // If the license key is already present in state, use it directly without making a network request
    const existingKey = item?.licenseKey || licenseKey
    if (existingKey) {
      setLicenseKey(existingKey)
      setIsModalOpen(true)
      return
    }

    if (!targetId || !token || isLoading) return

    try {
      setIsLoading(true)
      const res = await accountService.getLicenseKey(targetId, token)
      const responseItem = res?.libraryItem ?? (res as unknown as LibraryItem)
      const key = responseItem?.licenseKey ?? (res as unknown as { licenseKey?: string })?.licenseKey

      if (responseItem?.id) {
        onLicenseKeyReceived?.(responseItem)
      } else if (item?.id && key) {
        onLicenseKeyReceived?.({ ...item, licenseKey: key })
      }

      setLicenseKey(key ?? '')
      setIsModalOpen(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    const keyToCopy = licenseKey || item?.licenseKey
    if (!keyToCopy) return

    const success = await copyToClipboard(keyToCopy)
    if (success) {
      setIsCopied(true)
      toast.success(t('account.subs.keyCopiedSuccess'))
      setTimeout(() => setIsCopied(false), 2000)
    } else {
      toast.error(t('common.somethingWrong'))
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setIsCopied(false)
    onModalClose?.()
  }

  return (
    <>
      <Button
        variant={variant}
        onClick={handleGetKey}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--m)]" />
            <span>{t('account.subs.gettingLicenseKey')}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Key className="h-4 w-4" />
            <span>{t('account.subs.getLicenseKey')}</span>
          </span>
        )}
      </Button>

      <ModalAlert
        isOpen={isModalOpen}
        onClose={handleClose}
        title={t('account.subs.licenseKeyModalTitle')}
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Key className="h-5 w-5" />
          </div>
        }
        description={
          <div className="space-y-3 pt-1">
            {item?.product?.name && (
              <p className="text-sm font-medium text-[var(--t)]">{item.product.name}</p>
            )}
            <p className="text-sm leading-relaxed text-[var(--m)]">
              {t('account.subs.licenseKeyModalDesc')}
            </p>
            <div className="space-y-1.5">
              <label htmlFor={inputId} className="block text-xs font-medium text-[var(--m)]">
                {t('account.subs.licenseKey')}
              </label>
              <div className="relative flex items-center">
                <input
                  id={inputId}
                  type="password"
                  readOnly
                  tabIndex={-1}
                  autoComplete="off"
                  spellCheck={false}
                  value={licenseKey ?? '••••••••••••••••••••'}
                  aria-label={t('account.subs.licenseKey')}
                  className="min-h-11 w-full rounded-xl border border-[var(--l)] bg-[var(--s)] pl-3 pr-11 font-mono text-base tracking-widest text-[var(--t)] outline-none select-none cursor-default"
                  onKeyDown={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={t('account.subs.copyKey')}
                  title={t('account.subs.copyKey')}
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--l)] hover:text-[var(--t)] transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        }
        confirmLabel={isCopied ? t('account.subs.copied') : t('account.subs.copyKey')}
        cancelLabel={t('account.subs.close')}
        confirmVariant="primary"
        onConfirm={handleCopy}
      />
    </>
  )
}

export const GetLicenseKeyButton = GetLicenseKey
