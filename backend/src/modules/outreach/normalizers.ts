import { parse } from 'tldts'

export const CHANNELS = [
  'telegram',
  'email',
  'linkedin',
  'facebook',
  'website',
] as const

export type Channel = (typeof CHANNELS)[number]

export interface NormalizedIdentifier {
  channel: Channel
  value: string
}

const MAX_INPUT_LENGTH = 2048

const TELEGRAM_USERNAME = /^[a-z][a-z0-9_]{3,31}$/
const EMAIL = /^[^\s@/]+@[^\s@/]+\.[^\s@/]{2,}$/

// Службові шляхи t.me: це інвайти, стікери й проксі, а не юзернейми.
const TELEGRAM_RESERVED = new Set([
  'joinchat',
  'addstickers',
  'addemoji',
  'addtheme',
  'setlanguage',
  'share',
  'proxy',
  'socks',
  'login',
  'iv',
  'boost',
  'giftcode',
  'invoice',
])

// Сайти, де адресу цілі визначає шлях, а не домен: github.com/acme та github.com/other різні.
const PATH_PLATFORMS = new Set([
  'medium.com',
  'dev.to',
  'github.com',
  'gitlab.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'threads.net',
  'threads.com',
  'reddit.com',
  'vk.com',
  'pinterest.com',
  'behance.net',
  'dribbble.com',
  'linktr.ee',
  'linkedin.com',
  'facebook.com',
  'fb.com',
  't.me',
  'telegram.me',
])

// Сайти, де ціль це піддомен: acme.substack.com та other.substack.com різні.
const SUBDOMAIN_PLATFORMS = new Set(['substack.com', 'tumblr.com', 'bubbleapps.io'])

// Параметри, що змінюють сторінку на Facebook. Решта (fbclid, utm_*, ref) це сміття.
const FACEBOOK_KEPT_PARAMS = ['id', 'story_fbid']

const toUrl = (raw: string): URL | null => {
  if (/\s/.test(raw)) return null

  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }
}

const hostParts = (url: URL) =>
  parse(url.hostname.toLowerCase(), { allowPrivateDomains: true })

const cleanPath = (pathname: string): string =>
  pathname.toLowerCase().replace(/\/+$/, '')

const telegramUsernameFrom = (raw: string): string | null => {
  const text = raw.trim()

  if (text.toLowerCase().startsWith('tg://')) {
    const url = toUrl(text)
    return url?.hostname === 'resolve' ? url.searchParams.get('domain') : null
  }

  if (text.startsWith('@')) {
    return text.slice(1)
  }

  const url = toUrl(text)
  const domain = url ? hostParts(url).domain : null

  if (url && (domain === 't.me' || domain === 'telegram.me')) {
    const segments = url.pathname.split('/').filter(Boolean)
    // t.me/s/name це веб-превʼю каналу.
    const name = segments[0] === 's' ? segments[1] : segments[0]
    return name && !TELEGRAM_RESERVED.has(name.toLowerCase()) ? name : null
  }

  return null
}

const telegram = (raw: string, isExplicit: boolean): string | null => {
  const found =
    telegramUsernameFrom(raw) ?? (isExplicit ? raw.trim() : null)
  const name = found?.toLowerCase()

  // Інвайти (t.me/+hash, t.me/joinchat/...) не юзернейми, їх відсікає перевірка формату.
  return name && TELEGRAM_USERNAME.test(name) ? name : null
}

const email = (raw: string): string | null => {
  const address = raw
    .trim()
    .replace(/^mailto:/i, '')
    .split('?')[0]
    .toLowerCase()

  // Плюс-адреси не склеюємо: user+a@x.com та user@x.com це різні скриньки.
  return EMAIL.test(address) ? address : null
}

const linkedin = (raw: string): string | null => {
  const url = toUrl(raw.trim())

  if (!url || hostParts(url).domain !== 'linkedin.com') return null

  const path = cleanPath(url.pathname)
  return path ? `linkedin.com${path}` : null
}

const facebook = (raw: string): string | null => {
  const url = toUrl(raw.trim())
  const domain = url ? hostParts(url).domain : null

  if (!url || (domain !== 'facebook.com' && domain !== 'fb.com')) return null

  const path = cleanPath(url.pathname)
  if (!path) return null

  const kept = FACEBOOK_KEPT_PARAMS.flatMap((key) => {
    const value = url.searchParams.get(key)
    return value ? [`${key}=${value}`] : []
  })

  return `facebook.com${path}${kept.length ? `?${kept.join('&')}` : ''}`
}

const website = (raw: string): string | null => {
  const url = toUrl(raw.trim())

  if (!url || !['http:', 'https:'].includes(url.protocol)) return null

  const { domain, hostname, isIp } = hostParts(url)

  if (!domain || isIp || !hostname) return null

  if (SUBDOMAIN_PLATFORMS.has(domain)) {
    return hostname.replace(/^www\./, '')
  }

  if (PATH_PLATFORMS.has(domain)) {
    return `${domain}${cleanPath(url.pathname)}`
  }

  // Основний домен: blog.company.com це та сама компанія, що company.com.
  return domain
}

const normalizers: Record<Channel, (raw: string, isExplicit: boolean) => string | null> =
  {
    telegram,
    email: (raw) => email(raw),
    linkedin: (raw) => linkedin(raw),
    facebook: (raw) => facebook(raw),
    website: (raw) => website(raw),
  }

export const isChannel = (value: string): value is Channel =>
  (CHANNELS as readonly string[]).includes(value)

export const detectChannel = (raw: string): Channel | null => {
  const text = raw.trim()

  if (telegramUsernameFrom(text) !== null) return 'telegram'

  if (EMAIL.test(text.replace(/^mailto:/i, '').split('?')[0])) return 'email'

  const url = toUrl(text)
  if (!url) return null

  const { domain } = hostParts(url)
  if (domain === 'linkedin.com') return 'linkedin'
  if (domain === 'facebook.com' || domain === 'fb.com') return 'facebook'

  return website(text) ? 'website' : null
}

// Повертає null, якщо значення не схоже на жоден підтримуваний ідентифікатор.
export const parseIdentifier = (
  raw: string,
  channel?: Channel
): NormalizedIdentifier | null => {
  if (!raw.trim() || raw.length > MAX_INPUT_LENGTH) return null

  const resolved = channel ?? detectChannel(raw)
  if (!resolved) return null

  const value = normalizers[resolved](raw, channel !== undefined)
  return value ? { channel: resolved, value } : null
}

// Посилання, за яким менеджер відкриває ціль одним дотиком.
export const identifierHref = ({ channel, value }: NormalizedIdentifier): string => {
  switch (channel) {
    case 'telegram':
      return `https://t.me/${value}`
    case 'email':
      return `mailto:${value}`
    default:
      return `https://${value}`
  }
}

export const PUBLICATION_CHANNELS = [
  'facebook',
  'instagram',
  'threads',
  'tiktok',
  'x',
  'youtube',
  'linkedin',
  'telegram',
  'website',
  'other',
] as const

export type PublicationChannel = (typeof PUBLICATION_CHANNELS)[number]

export const PUBLICATION_KINDS = ['post', 'ad', 'article', 'link_in_offer'] as const

export type PublicationKind = (typeof PUBLICATION_KINDS)[number]

// Параметри відстеження не змінюють допис: без них одне посилання не зʼявляється двічі.
const TRACKING_PARAM =
  /^(utm_.*|fbclid|gclid|igshid|igsh|si|ref|ref_src|ref_url|feature|mc_cid|mc_eid|_ga|share_id)$/i

// Ключ дедуплікації публікацій. Регістр шляху зберігаємо: коди дописів (Instagram, YouTube)
// чутливі до регістру. Повертає null, якщо це не http(s)-посилання.
export const normalizePublicationUrl = (raw: string): string | null => {
  let url: URL

  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null

  const host = url.hostname.toLowerCase().replace(/^(www|m|mobile)\./, '')
  if (!host.includes('.')) return null

  const params = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAM.test(key))
    .sort(([a], [b]) => a.localeCompare(b))
  const query = params.length
    ? `?${params.map(([key, value]) => `${key}=${value}`).join('&')}`
    : ''

  return `${host}${url.pathname.replace(/\/+$/, '')}${query}`
}
