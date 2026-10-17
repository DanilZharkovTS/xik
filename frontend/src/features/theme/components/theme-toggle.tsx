'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

import {
  DEFAULT_THEME,
  DEFAULT_THEME_PREFERENCE,
  isSiteTheme,
  isThemePreference,
  nextThemePreference,
  SYSTEM_DARK_QUERY,
  THEME_STORAGE_KEY,
} from '../theme-config'
import type { SiteTheme, ThemePreference } from '../theme-config'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const THEME_CHANGE_EVENT = 'xik-theme-change'

const PREFERENCE_LABEL_KEYS = {
  dark: 'site.theme.dark',
  light: 'site.theme.light',
  system: 'site.theme.system',
} as const satisfies Record<ThemePreference, string>

const PREFERENCE_ICONS = {
  dark: Moon,
  light: Sun,
  system: Monitor,
} as const satisfies Record<ThemePreference, typeof Moon>

function getDocumentPreference(): ThemePreference {
  if (typeof document === 'undefined') return DEFAULT_THEME_PREFERENCE
  const preference = document.documentElement.dataset.themePreference
  if (isThemePreference(preference)) return preference
  // Сторінка без атрибута вибору (старий скрипт): беремо застосовану тему.
  const theme = document.documentElement.dataset.theme
  return isSiteTheme(theme) ? theme : DEFAULT_THEME_PREFERENCE
}

function getServerPreference(): ThemePreference {
  return DEFAULT_THEME_PREFERENCE
}

function resolveTheme(preference: ThemePreference): SiteTheme {
  if (preference !== 'system') return preference
  if (typeof window === 'undefined' || !window.matchMedia) return DEFAULT_THEME
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? 'dark' : 'light'
}

function updateThemeColor(theme: SiteTheme): void {
  const themeColor = theme === 'light' ? '#ffffff' : '#000000'

  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.setAttribute('content', themeColor)
    })
}

function setDocumentPreference(preference: ThemePreference): void {
  const root = document.documentElement
  const theme = resolveTheme(preference)
  root.dataset.themePreference = preference
  root.dataset.theme = theme
  updateThemeColor(theme)
}

function applyPreference(preference: ThemePreference): void {
  setDocumentPreference(preference)

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // storage fallback
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

function subscribeToTheme(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleThemeChange = () => {
    onStoreChange()
  }

  // Вибір в іншій вкладці.
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    const preference = isThemePreference(event.newValue)
      ? event.newValue
      : DEFAULT_THEME_PREFERENCE
    setDocumentPreference(preference)
    onStoreChange()
  }

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    window.removeEventListener('storage', handleStorage)
  }
}

// Одна кнопка перемикає по колу: темна → світла → авто (як у системі).
// Іконка показує поточний вибір, підказка — наступний.
export function ThemeToggle(): ReactElement {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getDocumentPreference,
    getServerPreference,
  )
  const nextPreference = nextThemePreference(preference)
  const { t } = useI18n()
  const label = t('site.theme', {
    theme: t(PREFERENCE_LABEL_KEYS[nextPreference]),
  })
  const Icon = PREFERENCE_ICONS[preference]

  useEffect(() => {
    updateThemeColor(resolveTheme(preference))
  }, [preference])

  const handleThemeChange = () => {
    applyPreference(nextPreference)
  }

  return (
    <button
      aria-label={label}
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--s)] text-[var(--t)] transition-all hover:scale-105 active:scale-95"
      data-theme-preference={preference}
      data-theme-toggle=""
      onClick={handleThemeChange}
      title={label}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
    </button>
  )
}
