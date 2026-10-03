// Розпізнавання посилань на відео. Приймаємо лише https і відомі майданчики: у вбудовування
// (iframe) потрапляє тільки адреса, яку ми самі побудували з ідентифікатора, а не введена адміном.
export type VideoProvider = 'youtube' | 'vimeo' | 'tiktok' | 'facebook' | 'x'

export interface ParsedVideo {
  provider: VideoProvider
  // Адреса для iframe, завантажується лише після кліку (фасад).
  embedUrl: string
  // Сторінка відео на майданчику: запасне посилання й перехід за кліком.
  watchUrl: string
  // Прев'ю є лише у YouTube; в інших майданчиків без їхнього API його не отримати.
  thumbnail: string | null
  aspect: 'landscape' | 'portrait'
}

const YOUTUBE_ID = /^[\w-]{11}$/
const DIGITS = /^\d{5,25}$/

const hostOf = (url: URL): string => url.hostname.toLowerCase().replace(/^(www|m)\./, '')

const youtube = (url: URL): ParsedVideo | null => {
  const host = hostOf(url)
  let id: string | null = null
  let aspect: ParsedVideo['aspect'] = 'landscape'

  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, first, second] = url.pathname.split('/')

    if (first === 'watch') id = url.searchParams.get('v')
    else if (first === 'embed' || first === 'live' || first === 'shorts') id = second ?? null

    if (first === 'shorts') aspect = 'portrait'
  }

  if (!id || !YOUTUBE_ID.test(id)) return null

  return {
    provider: 'youtube',
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    aspect,
  }
}

const vimeo = (url: URL): ParsedVideo | null => {
  const host = hostOf(url)
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null

  const id = url.pathname.split('/').filter(Boolean).find((part) => /^\d{5,15}$/.test(part))
  if (!id) return null

  return {
    provider: 'vimeo',
    embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`,
    watchUrl: `https://vimeo.com/${id}`,
    thumbnail: null,
    aspect: 'landscape',
  }
}

const tiktok = (url: URL): ParsedVideo | null => {
  if (hostOf(url) !== 'tiktok.com') return null

  // Короткі посилання (vm.tiktok.com) без переходу не розкрити, тож потрібне повне.
  const match = url.pathname.match(/^\/@[\w.-]+\/video\/(\d+)\/?$/)
  const id = match?.[1]
  if (!id || !DIGITS.test(id)) return null

  return {
    provider: 'tiktok',
    embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
    watchUrl: `https://www.tiktok.com/@_/video/${id}`,
    thumbnail: null,
    aspect: 'portrait',
  }
}

const facebook = (url: URL): ParsedVideo | null => {
  const host = hostOf(url)
  const isFacebook = host === 'facebook.com' || host === 'fb.watch'
  if (!isFacebook) return null

  const path = url.pathname
  const isVideo =
    host === 'fb.watch'
      ? path.length > 1
      : /\/videos\/\d+/.test(path) || /^\/reel\/\d+/.test(path) || (/^\/watch\/?$/.test(path) && DIGITS.test(url.searchParams.get('v') ?? ''))

  if (!isVideo) return null

  // Беремо адресу без зайвих параметрів відстеження.
  const clean = /^\/watch\/?$/.test(path)
    ? `https://www.facebook.com/watch/?v=${url.searchParams.get('v')}`
    : `https://${host === 'fb.watch' ? 'fb.watch' : 'www.facebook.com'}${path}`

  return {
    provider: 'facebook',
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(clean)}&show_text=false`,
    watchUrl: clean,
    thumbnail: null,
    aspect: /^\/reel\//.test(path) ? 'portrait' : 'landscape',
  }
}

const x = (url: URL): ParsedVideo | null => {
  const host = hostOf(url)
  if (host !== 'x.com' && host !== 'twitter.com') return null

  const match = url.pathname.match(/^\/[\w]{1,15}\/status\/(\d+)\/?/) ?? url.pathname.match(/^\/i\/status\/(\d+)\/?/)
  const id = match?.[1]
  if (!id || !DIGITS.test(id)) return null

  return {
    provider: 'x',
    embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${id}`,
    watchUrl: `https://x.com/i/status/${id}`,
    thumbnail: null,
    aspect: 'landscape',
  }
}

export const parseVideoUrl = (raw: string): ParsedVideo | null => {
  let url: URL

  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null

  return youtube(url) ?? vimeo(url) ?? tiktok(url) ?? facebook(url) ?? x(url)
}
