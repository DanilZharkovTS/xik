'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { loginSchema, registerSchema } from '../auth.schema'
import { authService } from '../auth.service'
import useAuthStore from '../store'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { Button } from '@/src/shared/ui/button'
import { AuthInput } from './AuthInput'
import Link from 'next/link'

type FormErrors = Partial<Record<string, string>>

export const AuthForm: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()

  const form = useAuthStore((state) => state.form)
  const setAuthFormField = useAuthStore((state) => state.setAuthFormField)
  const setAuth = useAuthStore((state) => state.setAuth)

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const isRegister = pathname === '/auth/register'

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
        fieldErrors[field] = issue.message
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

      await authService.register(form)

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

      router.push('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col justify-center px-4 py-8 md:py-16">
      <h1 className="text-3xl font-medium md:text-4xl">
        {isRegister ? 'Create account' : 'Welcome back'}
      </h1>

      <p className="mt-1 text-[var(--m)]">
        {isRegister ? 'Sign up to get started.' : 'Sign in to continue.'}
      </p>

      <form
        onSubmit={isRegister ? registerSubmit : loginSubmit}
        noValidate
        className="mt-6 space-y-4 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4 md:p-6"
      >
        <AuthInput
          name="email"
          label="Email"
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
            label="Name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            error={errors.name}
          />
        )}

        <AuthInput
          name="password"
          label="Password"
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
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.confirmPassword}
          />
        )}

        <Button type="submit" className="min-h-12 w-full" disabled={isLoading}>
          {isLoading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <Link
        href={isRegister ? '/auth/login' : '/auth/register'}
        className="mt-4 inline-flex min-h-11 items-center justify-center text-[var(--m)] hover:text-[var(--t)]"
      >
        {isRegister ? 'Already have an account? Sign in' : 'No account? Create one'}
      </Link>
    </main>
  )
}
