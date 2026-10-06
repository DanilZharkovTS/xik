'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { ModalAlert } from '@/src/shared/ui/modal-alert'
import { accountService } from '../account.service'

export type RestoreSubscriptionButtonProps = {
  subscriptionId: string
  onRestored?: () => void
  className?: string
}

export function RestoreSubscriptionButton({
  subscriptionId,
  onRestored,
  className,
}: RestoreSubscriptionButtonProps): ReactElement {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRestore = async () => {
    if (!token || isLoading) return

    try {
      setIsLoading(true)
      await accountService.restoreSubscription(subscriptionId, token)
      toast.success(t('account.subs.restoredSuccess'))
      setIsModalOpen(false)
      onRestored?.()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {t('account.subs.restore')}
      </Button>

      <ModalAlert
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('account.subs.restoreModalTitle')}
        description={t('account.subs.restoreModalDesc')}
        confirmLabel={isLoading ? t('account.subs.restoring') : t('account.subs.restoreModalConfirm')}
        cancelLabel={t('account.subs.restoreModalDismiss')}
        confirmVariant="primary"
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <RotateCcw className="h-5 w-5" />
          </div>
        }
        isLoading={isLoading}
        onConfirm={handleRestore}
      />
    </>
  )
}
