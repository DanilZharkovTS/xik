'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'

import {
  DEFAULT_THEME,
  isSiteTheme,
  THEME_STORAGE_KEY,
} from '../theme-config'
import type { SiteTheme } from '../theme-config'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const THEME_CHANGE_EVENT = 'xik-theme-change'

function getDocumentTheme(): SiteTheme {
  if (typeof document === 'undefined') return DEFAULT_THEME
  const theme = document.documentElement.dataset.theme
  return isSiteTheme(theme) ? theme : DEFAULT_THEME
}

function getServerTheme(): SiteTheme {
  return DEFAULT_THEME
}

function updateThemeColor(theme: SiteTheme): void {
  const themeColor = theme === 'light' ? '#ffffff' : '#000000'

  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.setAttribute('content', themeColor)
    })
}

function applyTheme(theme: SiteTheme): void {
  document.documentElement.dataset.theme = theme
  updateThemeColor(theme)

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
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

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    const theme = isSiteTheme(event.newValue) ? event.newValue : DEFAULT_THEME
    document.documentElement.dataset.theme = theme
    updateThemeColor(theme)
    onStoreChange()
  }

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    window.removeEventListener('storage', handleStorage)
  }
}

export function ThemeToggle(): ReactElement {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getDocumentTheme,
    getServerTheme,
  )
  const isLightTheme = theme === 'light'
  const nextTheme = isLightTheme ? 'dark' : 'light'
  const { t } = useI18n()
  const label = t('site.theme', { theme: t(nextTheme === 'dark' ? 'site.theme.dark' : 'site.theme.light') })

  useEffect(() => {
    updateThemeColor(theme)
  }, [theme])

  const handleThemeChange = () => {
    applyTheme(nextTheme)
  }

  return (
    <button
      aria-label={label}
      aria-pressed={isLightTheme}
      className="flex size-8 items-center justify-center rounded-full bg-[var(--s)] text-sm text-[var(--t)] transition-all hover:scale-105 active:scale-95"
      data-theme-toggle=""
      onClick={handleThemeChange}
      title={label}
      type="button"
    >
      ◐
    </button>
  )
}

