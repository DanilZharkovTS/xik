import { DEFAULT_LOCALE, isLocale } from './i18n-store'
import type { Locale } from './i18n-store'

// Розділи, що не є публічним сайтом: мова там береться не з адреси, а з вибору користувача.
const WORKSPACE_PREFIXES = ['/admin', '/outreach', '/dashboard'] as const
const ACCOUNT_PREFIXES = ['/auth', '/account'] as const

const startsWithSegment = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`)

// "/es/products/x" -> { locale: 'es', path: '/products/x' }; без префікса locale англійська.
// Префікс /en теж знімається: сервер бачить внутрішню адресу після rewrite (/en/auth/login),
// а браузер публічну (/auth/login), і розділ сайту має визначатися однаково.
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split('/')

  if (isLocale(first)) {
    return { locale: first, path: `/${rest.join('/')}`.replace(/\/$/, '') || '/' }
  }

  return { locale: DEFAULT_LOCALE, path: pathname || '/' }
}

export type PathArea = 'public' | 'workspace' | 'account'

export function areaOf(pathname: string): PathArea {
  const { path } = splitLocale(pathname)

  if (WORKSPACE_PREFIXES.some((prefix) => startsWithSegment(path, prefix))) return 'workspace'
  if (ACCOUNT_PREFIXES.some((prefix) => startsWithSegment(path, prefix))) return 'account'

  return 'public'
}

// Адреса тієї ж сторінки іншою мовою: англійська без префікса, es і uk з префіксом.
export function localizedPath(pathname: string, locale: Locale): string {
  const { path } = splitLocale(pathname)

  if (locale === DEFAULT_LOCALE) return path

  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

// Адреса сторінки в мові: "/products" -> "/es/products", "/#ai" -> "/es#ai". Англійська без префікса.
export function withLocale(href: string, locale: Locale): string {
  if (!href.startsWith('/') || locale === DEFAULT_LOCALE) return href

  const match = href.match(/^([^?#]*)(.*)$/)
  const path = match?.[1] || '/'
  const rest = match?.[2] ?? ''

  return `${path === '/' ? `/${locale}` : `/${locale}${path}`}${rest}`
}
