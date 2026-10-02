export const siteConfig = {
  name: 'XIK',
  shortName: 'XIK',
  defaultTitle: 'XIK — AI Tools With Pixel Soul',
  description:
    'XIK builds focused AI tools for developers and teams, helping automate repetitive work and improve technical workflows.',
  origin: 'https://xik.app',
  openGraphImage: '/opengraph-image',
  openGraphImageAlt: 'XIK — AI Tools With Pixel Soul',
} as const

export function getAbsoluteUrl(pathname: string): string {
  return new URL(pathname, siteConfig.origin).toString()
}
