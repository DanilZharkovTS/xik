'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { authService } from '@/src/features/auth/auth.service'
import { formatPrice, productHref } from '@/src/features/catalog/catalog-product'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { LOCALES } from '@/src/shared/i18n/i18n-store'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { useI18n, useLocalePath, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'
import { Button } from '@/src/shared/ui/button'
import { Segmented } from '@/src/shared/ui/segmented'
import { TextField } from '@/src/shared/ui/text-field'
import { accountService } from '../account.service'
import type { LibraryItem, SavedProduct } from '../account.service'
import { CancelSubscriptionButton } from './CancelSubscriptionButton'
import { RestoreSubscriptionButton } from './RestoreSubscriptionButton'

type Tab = 'subs' | 'saved' | 'profile'

const STATUS_STYLE: Record<LibraryItem['status'], string> = {
  active: 'bg-emerald-500/15 text-[var(--t)]',
  canceled: 'bg-amber-500/15 text-[var(--t)]',
  expired: 'bg-[var(--l)] text-[var(--m)]',
}

const LANGUAGE_LABEL: Record<Locale, string> = { en: 'English', es: 'Español', uk: 'Українська' }

function Empty({ text, cta, href }: { text: string; cta?: string; href?: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--l)] p-6 text-center">
      <p className="text-sm text-[var(--m)]">{text}</p>
      {cta && href && (
        <Link
          href={href}
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[var(--t)] bg-[var(--t)] px-5 text-sm font-semibold text-[var(--bg)]"
        >
          {cta}
        </Link>
      )}
    </div>
  )
}

export function AccountScreen(): ReactElement {
  const { t, locale } = useI18n()
  const href = useLocalePath()
  const token = useAuthStore((state) => state.accessToken)
  const [tab, setTab] = useState<Tab>('subs')

  const [library, setLibrary] = useState<LibraryItem[] | null>(null)
  const [saved, setSaved] = useState<SavedProduct[] | null>(null)

  const date = useCallback(
    (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value)),
    [locale],
  )

  // Покупки й збережене приходять потрібною мовою, тож перезавантажуються при зміні мови.
  useEffect(() => {
    if (!token) return
    let isCurrent = true

    Promise.all([accountService.library(locale, token), accountService.saved(locale, token)])
      .then(([items, products]) => {
        if (!isCurrent) return
        setLibrary(items)
        setSaved(products)
      })
      .catch((err) => toast.error(getErrorMessage(err)))

    return () => {
      isCurrent = false
    }
  }, [token, locale])

  const removeSaved = async (product: SavedProduct) => {
    if (!token) return

    try {
      await accountService.toggleSaved(product.id, token)
      setSaved((current) => current?.filter((item) => item.id !== product.id) ?? null)
      toast.success(t('account.saved.removed'))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
      <h1 className="text-2xl font-medium md:text-4xl">{t('account.title')}</h1>

      <Segmented<Tab>
        className="mt-4"
        label={t('account.tabs')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'subs', label: t('account.tab.subs') },
          { value: 'saved', label: t('account.tab.saved') },
          { value: 'profile', label: t('account.tab.profile') },
        ]}
      />

      <div className="mt-4">
        {tab === 'subs' &&
          (library === null ? (
            <p className="text-sm text-[var(--m)]">{t('account.loading')}</p>
          ) : library.length === 0 ? (
            <Empty text={t('account.subs.empty')} cta={t('account.subs.browse')} href={href('/products')} />
          ) : (
            <ul className="space-y-3">
              {library.map((item) => (
                <li key={item.id} className="rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={href(productHref(item.product))}
                      className="min-w-0 text-base font-semibold hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status]}`}>
                      {t(`account.status.${item.status}` as 'account.status.active')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--m)]">
                    {[
                      t('account.subs.since', { date: date(item.createdAt) }),
                      item.accessExpiresAt
                        ? t(item.status === 'expired' ? 'account.subs.endedOn' : 'account.subs.until', {
                            date: date(item.accessExpiresAt),
                          })
                        : null,
                      formatPrice(item.product, locale) || null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {item.status === 'active' && (item.subscriptionId || item.id) && (
                    <div className="mt-3 flex justify-end">
                      <CancelSubscriptionButton
                        subscriptionId={item.subscriptionId ?? item.id}
                        onCanceled={() => {
                          setLibrary((current) =>
                            current?.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, status: 'canceled', canceledAt: new Date().toISOString() }
                                : entry,
                            ) ?? null,
                          )
                        }}
                      />
                    </div>
                  )}
                  {item.status === 'canceled' && (item.subscriptionId || item.id) && (
                    <div className="mt-3 flex justify-end">
                      <RestoreSubscriptionButton
                        subscriptionId={item.subscriptionId ?? item.id}
                        onRestored={() => {
                          setLibrary((current) =>
                            current?.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, status: 'active', canceledAt: null }
                                : entry,
                            ) ?? null,
                          )
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ))}

        {tab === 'saved' &&
          (saved === null ? (
            <p className="text-sm text-[var(--m)]">{t('account.loading')}</p>
          ) : saved.length === 0 ? (
            <Empty text={t('account.saved.empty')} cta={t('account.subs.browse')} href={href('/products')} />
          ) : (
            <ul className="space-y-3">
              {saved.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:p-4"
                >
                  <Link href={href(productHref(product))} className="min-w-0">
                    <span className="block truncate text-base font-semibold hover:underline">{product.name}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-[var(--m)]">
                      {product.shortDescription}
                    </span>
                  </Link>
                  <Button variant="secondary" onClick={() => removeSaved(product)}>
                    {t('account.saved.remove')}
                  </Button>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'profile' && <ProfileTab />}
      </div>
    </div>
  )
}

function ProfileTab(): ReactElement {
  const { t, locale, setLocale } = useI18n()
  const up = useUrlLocalePath()
  const router = useRouter()
  const token = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const [name, setName] = useState(user?.name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const save = async (patch: { name?: string; locale?: Locale }) => {
    if (!token) return

    try {
      setIsSaving(true)
      const profile = await accountService.update(patch, token)
      const current = useAuthStore.getState()
      if (current.user) setAuth({ accessToken: current.accessToken, user: { ...current.user, name: profile.name, locale: profile.locale } })
      if (patch.locale) setLocale(patch.locale)
      toast.success(t('account.profile.saved'))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      await authService.logout()
      clearAuth()
      router.push(up('/auth/login'))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:p-4">
        <TextField label={t('account.profile.email')} value={user?.email ?? ''} readOnly disabled />
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim()) void save({ name: name.trim() })
          }}
        >
          <TextField
            label={t('account.profile.name')}
            maxLength={50}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" disabled={isSaving || !name.trim() || name.trim() === user?.name}>
            {isSaving ? t('account.profile.saving') : t('account.profile.save')}
          </Button>
        </form>
      </section>

      <section className="space-y-2 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:p-4">
        <h2 className="text-sm text-[var(--m)]">{t('account.profile.language')}</h2>
        <Segmented<Locale>
          label={t('account.profile.language')}
          value={locale}
          onChange={(next) => void save({ locale: next })}
          options={LOCALES.map((code) => ({ value: code, label: LANGUAGE_LABEL[code] }))}
        />
        <p className="text-sm text-[var(--m)]">{t('account.profile.languageHint')}</p>
      </section>

      <Button variant="secondary" className="w-full" onClick={logout} disabled={isLoggingOut}>
        {isLoggingOut ? t('account.profile.signingOut') : t('account.profile.logout')}
      </Button>
    </div>
  )
}
