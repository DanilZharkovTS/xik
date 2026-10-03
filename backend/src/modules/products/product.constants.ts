export const PRODUCT_CATEGORIES = [
  'development',
  'writing',
  'design',
  'productivity',
  'education',
  'business',
  'marketing',
  'finance',
  'research',
  'analytics',
  'communication',
  'automation',
  'imageGeneration',
  'videoGeneration',
  'audio',
  'translation',
  'socialMedia',
  'sales',
  'legal',
  'cybersecurity',
  'dataScience',
  'lifestyle',
] as const

export const PRODUCT_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
  'CNY',
  'UAH',
] as const

export const PRODUCT_BILLING_PERIODS = [
  'week',
  'month',
  'year',
] as const
export const PRODUCT_KINDS = ['product', 'agent'] as const

export const PRODUCT_STATUSES = ['production', 'active', 'beta', 'build'] as const

// Мови контенту. Англійська обовʼязкова й живе в основних полях; es і uk лежать у translations.
export const CONTENT_LOCALES = ['en', 'es', 'uk'] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]
export const TRANSLATION_LOCALES = ['es', 'uk'] as const
