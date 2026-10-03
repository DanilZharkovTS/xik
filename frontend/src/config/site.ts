import type { Locale } from '@/src/shared/i18n/i18n-store'

// Тексти для пошукової видачі й соцмереж по мовах: у кожної мови своя сторінка в Google.
const SITE_TEXT: Record<Locale, { defaultTitle: string; description: string; imageAlt: string }> = {
  en: {
    defaultTitle: 'XIK — AI Products, Agents & Engineering Services',
    description:
      'XIK builds production AI products, autonomous agents and engineering services: observability, licensing, security testing, RAG and Telegram or voice AI for developers and teams.',
    imageAlt: 'XIK — AI Products, Agents & Engineering Services',
  },
  es: {
    defaultTitle: 'XIK — Productos de IA, agentes e ingeniería',
    description:
      'XIK crea productos de IA en producción, agentes autónomos y servicios de ingeniería: observabilidad, licencias, pruebas de seguridad, RAG e IA para Telegram y voz para desarrolladores y equipos.',
    imageAlt: 'XIK — Productos de IA, agentes e ingeniería',
  },
  uk: {
    defaultTitle: 'XIK — AI-продукти, агенти та інженерні послуги',
    description:
      'XIK створює AI-продукти для продакшну, автономних агентів та інженерні послуги: observability, ліцензування, тестування безпеки, RAG, Telegram і голосовий AI для розробників і команд.',
    imageAlt: 'XIK — AI-продукти, агенти та інженерні послуги',
  },
}

export const siteConfig = {
  name: 'XIK',
  shortName: 'XIK',
  defaultTitle: SITE_TEXT.en.defaultTitle,
  description: SITE_TEXT.en.description,
  // Канонічний домен береться зі змінної середовища; без неї працює xik.app.
  origin: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xik.app').replace(/\/$/, ''),
  openGraphImage: '/opengraph-image',
  openGraphImageAlt: SITE_TEXT.en.imageAlt,
} as const

export const siteText = (locale: Locale) => SITE_TEXT[locale]

export function getAbsoluteUrl(pathname: string): string {
  return new URL(pathname, siteConfig.origin).toString()
}
