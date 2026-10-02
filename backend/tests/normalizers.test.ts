import { describe, expect, it } from 'vitest'
import {
  detectChannel,
  identifierHref,
  parseIdentifier,
  type Channel,
} from '../src/modules/outreach/normalizers.js'

const check = (
  channel: Channel,
  cases: Array<[input: string, expected: string | null]>
) => {
  it.each(cases)(`${channel}: %s -> %s`, (input, expected) => {
    const result = parseIdentifier(input, channel)
    expect(result?.value ?? null).toBe(expected)
  })
}

describe('telegram', () => {
  check('telegram', [
    ['@Durov', 'durov'],
    ['  @Durov  ', 'durov'],
    ['t.me/Durov', 'durov'],
    ['https://t.me/Durov/', 'durov'],
    ['http://www.t.me/durov?start=abc', 'durov'],
    ['https://telegram.me/durov', 'durov'],
    ['https://t.me/s/durov', 'durov'],
    ['tg://resolve?domain=Durov', 'durov'],
    ['durov', 'durov'],
    ['https://t.me/+AbCdEf123', null],
    ['https://t.me/joinchat/AAAA', null],
    ['@a', null],
    ['@has space', null],
    ['@1starts_with_digit', null],
  ])
})

describe('email', () => {
  check('email', [
    ['John@Example.COM', 'john@example.com'],
    ['  john@example.com ', 'john@example.com'],
    ['mailto:John@Example.com?subject=Hi', 'john@example.com'],
    ['john+promo@example.com', 'john+promo@example.com'],
    ['john@example', null],
    ['not an email', null],
    ['@example.com', null],
  ])

  it('плюс-адреси не склеюються з базовою', () => {
    expect(parseIdentifier('a+x@b.com', 'email')?.value).not.toBe(
      parseIdentifier('a@b.com', 'email')?.value
    )
  })
})

describe('linkedin', () => {
  check('linkedin', [
    ['https://www.linkedin.com/in/John-Doe/', 'linkedin.com/in/john-doe'],
    ['linkedin.com/in/john-doe?utm_source=share&utm_medium=ios', 'linkedin.com/in/john-doe'],
    ['https://ua.linkedin.com/in/john-doe#about', 'linkedin.com/in/john-doe'],
    ['https://m.linkedin.com/company/Acme', 'linkedin.com/company/acme'],
    ['https://linkedin.com/', null],
    ['https://example.com/in/john', null],
  ])
})

describe('facebook', () => {
  check('facebook', [
    ['https://www.facebook.com/John.Doe/', 'facebook.com/john.doe'],
    ['https://m.facebook.com/john.doe?fbclid=abc&ref=bookmarks', 'facebook.com/john.doe'],
    ['https://web.facebook.com/john.doe', 'facebook.com/john.doe'],
    ['https://fb.com/john.doe', 'facebook.com/john.doe'],
    ['https://www.facebook.com/profile.php?id=100001&fbclid=x', 'facebook.com/profile.php?id=100001'],
    ['facebook.com/', null],
    ['https://example.com/john', null],
  ])
})

describe('website', () => {
  check('website', [
    ['https://www.Company.com/about?utm_source=x', 'company.com'],
    ['company.com', 'company.com'],
    ['http://company.com/contact/', 'company.com'],
    ['https://blog.company.com/post', 'company.com'],
    ['https://shop.company.com.ua', 'company.com.ua'],
    ['https://company.co.uk/team', 'company.co.uk'],
    // Платформи: ціль визначає шлях або піддомен.
    ['https://medium.com/@Author/post-1', 'medium.com/@author/post-1'],
    ['https://github.com/Acme/', 'github.com/acme'],
    ['https://acme.github.io/site', 'acme.github.io'],
    ['https://acme.substack.com/p/hi', 'acme.substack.com'],
    ['https://other.substack.com', 'other.substack.com'],
    ['http://192.168.0.1/admin', null],
    ['localhost', null],
    ['ftp://company.com', null],
    ['has space.com', null],
  ])

  it('піддомен і основний домен це одна ціль', () => {
    expect(parseIdentifier('blog.company.com', 'website')?.value).toBe(
      parseIdentifier('www.company.com', 'website')?.value
    )
  })
})

describe('автовизначення каналу', () => {
  it.each([
    ['@durov', 'telegram', 'durov'],
    ['t.me/durov', 'telegram', 'durov'],
    ['tg://resolve?domain=durov', 'telegram', 'durov'],
    ['john@example.com', 'email', 'john@example.com'],
    ['mailto:john@example.com', 'email', 'john@example.com'],
    ['https://linkedin.com/in/john', 'linkedin', 'linkedin.com/in/john'],
    ['https://www.facebook.com/john', 'facebook', 'facebook.com/john'],
    ['https://fb.com/john', 'facebook', 'facebook.com/john'],
    ['https://www.company.com/page', 'website', 'company.com'],
    ['company.com', 'website', 'company.com'],
  ])('%s -> %s', (input, channel, value) => {
    expect(detectChannel(input)).toBe(channel)
    expect(parseIdentifier(input)).toEqual({ channel, value })
  })

  it.each(['', '   ', 'durov', 'just words here', 'http://localhost', 'x'.repeat(3000)])(
    'не визначається: %j',
    (input) => {
      expect(parseIdentifier(input)).toBeNull()
    }
  )

  it('канал можна задати вручну для голого юзернейма', () => {
    expect(parseIdentifier('durov', 'telegram')).toEqual({
      channel: 'telegram',
      value: 'durov',
    })
  })

  it('різні записи одного Telegram дають одне значення', () => {
    const values = ['@Durov', 't.me/durov', 'https://t.me/DUROV/', 'tg://resolve?domain=durov'].map(
      (v) => parseIdentifier(v)?.value
    )
    expect(new Set(values).size).toBe(1)
  })
})

describe('посилання для відкриття', () => {
  it.each([
    [{ channel: 'telegram', value: 'durov' }, 'https://t.me/durov'],
    [{ channel: 'email', value: 'a@b.com' }, 'mailto:a@b.com'],
    [{ channel: 'linkedin', value: 'linkedin.com/in/john' }, 'https://linkedin.com/in/john'],
    [{ channel: 'facebook', value: 'facebook.com/john' }, 'https://facebook.com/john'],
    [{ channel: 'website', value: 'company.com' }, 'https://company.com'],
  ] as const)('%j', (identifier, href) => {
    expect(identifierHref(identifier)).toBe(href)
  })
})
