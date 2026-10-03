export const siteConfig = {
  name: 'XIK',
  shortName: 'XIK',
  defaultTitle: 'XIK — AI Products, Agents & Engineering Services',
  description:
    'XIK builds production AI products, autonomous agents and engineering services: observability, licensing, security testing, RAG and Telegram or voice AI for developers and teams.',
  // Канонічний домен береться зі змінної середовища; без неї працює xik.app.
  origin: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xik.app').replace(/\/$/, ''),
  openGraphImage: '/opengraph-image',
  openGraphImageAlt: 'XIK — AI Products, Agents & Engineering Services',
} as const

export function getAbsoluteUrl(pathname: string): string {
  return new URL(pathname, siteConfig.origin).toString()
}
