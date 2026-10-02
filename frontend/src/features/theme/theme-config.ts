export const DEFAULT_THEME = 'dark'
export const THEME_STORAGE_KEY = 'xik-theme'

export type SiteTheme = 'dark' | 'light'

export function isSiteTheme(value: unknown): value is SiteTheme {
  return value === 'dark' || value === 'light'
}
