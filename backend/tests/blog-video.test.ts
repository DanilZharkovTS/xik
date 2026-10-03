import { describe, expect, it } from 'vitest'
import { parseVideoUrl } from '../src/modules/blog/blog.video.js'

describe('розпізнавання відео', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=10', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('YouTube: %s', (url, id) => {
    const video = parseVideoUrl(url)
    expect(video).toMatchObject({
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    })
  })

  it('YouTube Shorts вертикальні', () => {
    expect(parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')?.aspect).toBe('portrait')
  })

  it('Vimeo, TikTok, Facebook, X', () => {
    expect(parseVideoUrl('https://vimeo.com/123456789')).toMatchObject({ provider: 'vimeo', embedUrl: 'https://player.vimeo.com/video/123456789?dnt=1' })
    expect(parseVideoUrl('https://vimeo.com/channels/staffpicks/123456789')?.provider).toBe('vimeo')
    expect(parseVideoUrl('https://www.tiktok.com/@xik.app/video/7234567890123456789')).toMatchObject({
      provider: 'tiktok',
      embedUrl: 'https://www.tiktok.com/embed/v2/7234567890123456789',
      aspect: 'portrait',
    })
    expect(parseVideoUrl('https://www.facebook.com/xik/videos/1234567890123/')).toMatchObject({ provider: 'facebook' })
    expect(parseVideoUrl('https://www.facebook.com/watch/?v=1234567890123&extra=1')?.watchUrl).toBe('https://www.facebook.com/watch/?v=1234567890123')
    expect(parseVideoUrl('https://fb.watch/abcDEF123/')).toMatchObject({ provider: 'facebook' })
    expect(parseVideoUrl('https://x.com/xik/status/1234567890123456789')).toMatchObject({
      provider: 'x',
      embedUrl: 'https://platform.twitter.com/embed/Tweet.html?id=1234567890123456789',
    })
    expect(parseVideoUrl('https://twitter.com/xik/status/1234567890123456789')?.provider).toBe('x')
  })

  it('відхиляє чуже, небезпечне й неповне', () => {
    for (const url of [
      'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'javascript:alert(1)',
      'https://evil.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/watch?v="><script>',
      'https://vm.tiktok.com/ZMabcdef/',
      'https://www.tiktok.com/@xik',
      'https://www.facebook.com/xik',
      'https://x.com/xik',
      'not a url',
      '',
    ]) {
      expect(parseVideoUrl(url), url).toBeNull()
    }
  })

  it('у адресу вбудовування потрапляє лише побудоване з ідентифікатора', () => {
    const video = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&autoplay=1&evil=%22')!
    expect(video.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
})
