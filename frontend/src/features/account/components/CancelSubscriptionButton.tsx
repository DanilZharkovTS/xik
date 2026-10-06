'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
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
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    if (!token || isLoading) return

    try {
      setIsLoading(true)
      await accountService.cancelSubscription(subscriptionId, token)
      toast.success(t('account.subs.canceledSuccess'))
      onCanceled?.()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleCancel}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? t('account.subs.canceling') : t('account.subs.cancel')}
    </Button>
  )
}
