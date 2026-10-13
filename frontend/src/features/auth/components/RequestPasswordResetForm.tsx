'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CheckCircle2, ArrowLeft, Mail } from 'lucide-react'

import { requestPasswordResetSchema } from '../auth.schema'
import { authService } from '../auth.service'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { translateNow } from '@/src/shared/i18n/translate'
import type { MessageKey } from '@/src/shared/i18n/messages'
import { LanguageSwitch } from '@/src/shared/i18n/language-switch'
import { Button } from '@/src/shared/ui/button'
import { AuthInput } from './AuthInput'
import { useI18n, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'

export const RequestPasswordResetForm: React.FC = () => {
  const { t } = useI18n()
  const up = useUrlLocalePath()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) {
      setError(undefined)
    }
  }

  const validate = (): boolean => {
    const result = requestPasswordResetSchema.safeParse({ email: email.trim() })
    if (result.success) {
      setError(undefined)
      return true
    }

    const firstIssue = result.error.issues[0]
    if (firstIssue) {
      setError(translateNow(firstIssue.message as MessageKey))
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setIsLoading(true)
      await authService.requestPasswordReset({ email: email.trim() })
      setIsSuccess(true)
      toast.success(t('auth.requestPasswordReset.success'))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col justify-center px-4 py-8 md:py-16">
      <LanguageSwitch className="mb-4 self-start" />

      <h1 className="text-2xl font-medium md:text-4xl">
        {t('auth.requestPasswordReset.title')}
      </h1>

      <p className="mt-1 text-[var(--m)]">
        {t('auth.requestPasswordReset.subtitle')}
      </p>

      {isSuccess ? (
        <div className="mt-6 space-y-5 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-6 md:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-medium text-[var(--t)]">
              {t('auth.requestPasswordReset.success')}
            </h2>
            <p className="text-sm text-[var(--m)] break-all">
              {email}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="secondary"
              className="w-full min-h-11"
              onClick={() => {
                setIsSuccess(false)
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              {t('auth.requestPasswordReset.send')}
            </Button>

            <Link
              href={up('/auth/login')}
              className="inline-flex min-h-11 items-center justify-center text-sm text-[var(--m)] hover:text-[var(--t)] transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t('auth.requestPasswordReset.backToLogin')}
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-4 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4 md:p-6"
        >
          <AuthInput
            name="email"
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={error}
          />

          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={isLoading}
          >
            {isLoading ? t('auth.wait') : t('auth.requestPasswordReset.send')}
          </Button>
        </form>
      )}

      {!isSuccess && (
        <Link
          href={up('/auth/login')}
          className="mt-4 inline-flex min-h-11 items-center justify-center text-[var(--m)] hover:text-[var(--t)] transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('auth.requestPasswordReset.backToLogin')}
        </Link>
      )}
    </main>
  )
}
