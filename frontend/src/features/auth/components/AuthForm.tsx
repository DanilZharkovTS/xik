'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { loginSchema, registerSchema } from '../auth.schema'
import { authService } from '../auth.service'
import useAuthStore from '../store'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { translateNow } from '@/src/shared/i18n/translate'
import type { MessageKey } from '@/src/shared/i18n/messages'
import { LanguageSwitch } from '@/src/shared/i18n/language-switch'
import { Button } from '@/src/shared/ui/button'
import { AuthInput } from './AuthInput'
import Link from 'next/link'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { splitLocale } from '@/src/shared/i18n/paths'

type FormErrors = Partial<Record<string, string>>

export const AuthForm: React.FC = () => {
  const { t, locale, setLocale } = useI18n()
  const pathname = usePathname()
  const router = useRouter()

  const form = useAuthStore((state) => state.form)
  const setAuthFormField = useAuthStore((state) => state.setAuthFormField)
  const setAuth = useAuthStore((state) => state.setAuth)

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const isRegister = splitLocale(pathname).path === '/auth/register'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setAuthFormField(name, value)

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }))
  }

  const validateForm = () => {
    const schema = isRegister ? registerSchema : loginSchema
    const result = schema.safeParse(form)

    if (result.success) {
      setErrors({})
      return true
    }

    const fieldErrors: FormErrors = {}

    for (const issue of result.error.issues) {
      const field = issue.path[0]

      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = translateNow(issue.message as MessageKey)
      }
    }

    setErrors(fieldErrors)

    return false
  }

  const registerSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      await authService.register({ ...form, locale })

      router.push('/auth/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const loginSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      const res = await authService.login({
        email: form.email,
        password: form.password,
      })

      setAuth({
        accessToken: res.accessToken,
        user: res.user,
      })

      // Мова з профілю стає мовою інтерфейсу; персонал в адмінці знає лише en і uk.
      if (res.user?.locale) setLocale(res.user.locale)

      router.push(res.user?.role === 'user' ? '/account' : '/dashboard')
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
        {isRegister ? t('auth.register.title') : t('auth.login.title')}
      </h1>

      <p className="mt-1 text-[var(--m)]">
        {isRegister ? t('auth.register.subtitle') : t('auth.login.subtitle')}
      </p>

      <form
        onSubmit={isRegister ? registerSubmit : loginSubmit}
        noValidate
        className="mt-6 space-y-4 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4 md:p-6"
      >
        <AuthInput
          name="email"
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={errors.email}
        />

        {isRegister && (
          <AuthInput
            name="name"
            label={t('auth.name')}
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t('auth.namePlaceholder')}
            error={errors.name}
          />
        )}

        <AuthInput
          name="password"
          label={t('auth.password')}
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.password}
        />

        {isRegister && (
          <AuthInput
            name="confirmPassword"
            label={t('auth.confirm')}
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.confirmPassword}
          />
        )}

        <Button type="submit" className="min-h-11 w-full" disabled={isLoading}>
          {isLoading ? t('auth.wait') : isRegister ? t('auth.createAccount') : t('auth.signIn')}
        </Button>
      </form>

      <Link
        href={isRegister ? '/auth/login' : '/auth/register'}
        className="mt-4 inline-flex min-h-11 items-center justify-center text-[var(--m)] hover:text-[var(--t)]"
      >
        {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}
      </Link>
    </main>
  )
}
