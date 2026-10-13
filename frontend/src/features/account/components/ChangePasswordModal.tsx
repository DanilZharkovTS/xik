'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'

import { changePasswordSchema } from '@/src/features/auth/auth.schema'
import { authService } from '@/src/features/auth/auth.service'
import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import type { MessageKey } from '@/src/shared/i18n/messages'
import { translateNow } from '@/src/shared/i18n/translate'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { ModalAlert } from '@/src/shared/ui/modal-alert'
import { Sheet } from '@/src/shared/ui/sheet'
import { TextField } from '@/src/shared/ui/text-field'

type ChangePasswordModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps): ReactElement {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [errors, setErrors] = useState<{
    currentPassword?: string
    newPassword?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailConfirm, setShowEmailConfirm] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const result = changePasswordSchema.safeParse(form)
    if (result.success) {
      setErrors({})
      return true
    }

    const nextErrors: { currentPassword?: string; newPassword?: string } = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as 'currentPassword' | 'newPassword'
      if (field && !nextErrors[field]) {
        nextErrors[field] = translateNow(issue.message as MessageKey)
      }
    }
    setErrors(nextErrors)
    return false
  }

  const handleClose = () => {
    setForm({ currentPassword: '', newPassword: '' })
    setErrors({})
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsLoading(true)
      await authService.changePassword(form, token)
      toast.success(t('auth.changePassword.success'))
      handleClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true)
      await authService.requestPasswordChange(token)
      toast.success(t('auth.changePassword.emailSent'))
      setShowEmailConfirm(false)
      handleClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <>
      <Sheet
        title={t('auth.changePassword.title')}
        isOpen={isOpen}
        onClose={handleClose}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1">
            <TextField
              id="currentPassword"
              name="currentPassword"
              label={t('auth.changePassword.currentPassword')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.currentPassword}
              onChange={handleChange}
              className={errors.currentPassword ? 'border-red-500' : undefined}
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-1">
            <TextField
              id="newPassword"
              name="newPassword"
              label={t('auth.changePassword.newPassword')}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.newPassword}
              onChange={handleChange}
              className={errors.newPassword ? 'border-red-500' : undefined}
            />
            {errors.newPassword && (
              <p className="text-xs text-red-500">{errors.newPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full min-h-11"
            disabled={isLoading || isSendingEmail}
          >
            {isLoading ? t('auth.wait') : t('auth.changePassword.submit')}
          </Button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--l)]" />
            </div>
            <span className="relative bg-[var(--bg)] px-3 text-xs uppercase text-[var(--m)]">
              {t('auth.changePassword.or')}
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full min-h-11 flex items-center justify-center gap-2"
            onClick={() => setShowEmailConfirm(true)}
            disabled={isLoading || isSendingEmail}
          >
            <Mail className="h-4 w-4" />
            {t('auth.changePassword.viaEmail')}
          </Button>
        </form>
      </Sheet>

      <ModalAlert
        isOpen={showEmailConfirm}
        onClose={() => setShowEmailConfirm(false)}
        title={t('auth.changePassword.confirmEmailTitle')}
        description={t('auth.changePassword.confirmEmailDesc')}
        confirmLabel={t('auth.changePassword.confirmEmailAction')}
        cancelLabel={t('auth.changePassword.cancel')}
        icon={<Mail className="h-5 w-5 text-[var(--t)]" />}
        isLoading={isSendingEmail}
        onConfirm={handleSendEmail}
      />
    </>
  )
}
