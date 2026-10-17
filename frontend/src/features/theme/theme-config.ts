export const DEFAULT_THEME = 'dark'
export const THEME_STORAGE_KEY = 'xik-theme'

/** Тема, яка реально застосована до сторінки (`html[data-theme]`). */
export type SiteTheme = 'dark' | 'light'

/** Вибір користувача: конкретна тема або «Авто» — як у системі. */
export type ThemePreference = SiteTheme | 'system'

export const DEFAULT_THEME_PREFERENCE: ThemePreference = DEFAULT_THEME

/** Порядок перемикання кнопкою: темна → світла → авто → темна. */
export const THEME_PREFERENCE_ORDER: readonly ThemePreference[] = [
  'dark',
  'light',
  'system',
]

export const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

export function isSiteTheme(value: unknown): value is SiteTheme {
  return value === 'dark' || value === 'light'
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return isSiteTheme(value) || value === 'system'
}

export function nextThemePreference(
  preference: ThemePreference,
): ThemePreference {
  const index = THEME_PREFERENCE_ORDER.indexOf(preference)
  return THEME_PREFERENCE_ORDER[(index + 1) % THEME_PREFERENCE_ORDER.length]
}
