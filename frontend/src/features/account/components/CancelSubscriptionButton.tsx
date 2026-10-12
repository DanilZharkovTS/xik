'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { ModalAlert } from '@/src/shared/ui/modal-alert'
import { accountService } from '../account.service'

export type CancelSubscriptionButtonProps = {
  subscriptionId: string
  onCanceled?: () => void
  className?: string
}

export function CancelSubscriptionButton({
  subscriptionId,
  onCanceled,
  className,
}: CancelSubscriptionButtonProps): ReactElement {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    if (!token || isLoading) return

    try {
      setIsLoading(true)
      await accountService.cancelSubscription(subscriptionId, token)
      toast.success(t('account.subs.canceledSuccess'))
      setIsModalOpen(false)
      onCanceled?.()
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
        {t('account.subs.cancel')}
      </Button>

      <ModalAlert
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('account.subs.cancelModalTitle')}
        description={t('account.subs.cancelModalDesc')}
        confirmLabel={isLoading ? t('account.subs.canceling') : t('account.subs.cancelModalConfirm')}
        cancelLabel={t('account.subs.cancelModalKeep')}
        confirmVariant="danger"
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
        }
        isLoading={isLoading}
        onConfirm={handleCancel}
      />
    </>
  )
}
