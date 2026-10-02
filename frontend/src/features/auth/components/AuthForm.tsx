'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { loginSchema, registerSchema } from '../auth.schema'
import { authService } from '../auth.service'
import useAuthStore from '../store'

import { PageContainer } from '@/src/shared/ui/pixel/page-container'
import { PixelButton } from '@/src/shared/ui/pixel/pixel-button'
import { PixelHeading } from '@/src/shared/ui/pixel/pixel-heading'
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
      if (err instanceof Error) {
        toast.error(err.message)
      }

      console.error(err)
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
      if (err instanceof Error) {
        toast.error(err.message)
      }

      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100svh-var(--header-height))] items-center border-b-pixel border-border">
      <PageContainer className="flex w-full justify-center py-12 md:py-16">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-foreground-muted">
              {'// auth.system'}
            </p>

            <PixelHeading as="h1" size="page">
              {isRegister ? 'Create account.' : 'Welcome back.'}
            </PixelHeading>

            <p className="mt-4 font-mono text-sm leading-relaxed text-foreground-muted">
              {isRegister
                ? 'Initialize your account and enter the network.'
                : 'Authenticate to continue to the system.'}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-widest text-foreground-muted">
                {isRegister ? 'register' : 'login'}
              </span>

              <span className="font-mono text-xs text-foreground-muted">
                {isRegister ? '01 / 02' : '01 / 01'}
              </span>
            </div>

            <form
              onSubmit={isRegister ? registerSubmit : loginSubmit}
              className="space-y-5 p-5 md:p-6"
            >
              <AuthInput
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                error={errors.email}
              />

              {isRegister && (
                <AuthInput
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  error={errors.name}
                />
              )}

              <AuthInput
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.password}
              />

              {isRegister && (
                <AuthInput
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                />
              )}

              <div className="border-t border-border pt-5">
                <PixelButton
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? 'Processing...'
                    : isRegister
                    ? 'Create Account'
                    : 'Authenticate'}
                </PixelButton>
              </div>
            </form>
          </div>

          <Link
            href={isRegister ? '/auth/login' : '/auth/register'}
            className="mt-4 font-mono text-xs text-foreground-muted hover:text-foreground"
          >
            <span className="mr-2">&gt;</span>
            {isRegister ? 'Already registered?' : 'No account?'}
          </Link>
        </div>
      </PageContainer>
    </main>
  )
}
