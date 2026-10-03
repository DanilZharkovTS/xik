import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  auth,
  createProduct,
  createUser,
  grant,
  inProduct,
  login,
  loginOk,
  resetDb,
} from './helpers.js'

beforeEach(resetDb)

type Method = 'get' | 'post' | 'patch' | 'delete'

// Усі ендпоінти журналу: що в кожного має бути закрито від кого.
const PRODUCT_ROUTES: Array<[Method, string]> = [
  ['post', '/api/outreach/check'],
  ['post', '/api/outreach/targets'],
  ['get', '/api/outreach/targets'],
  ['get', '/api/outreach/targets/x'],
  ['post', '/api/outreach/targets/x/identifiers'],
  ['post', '/api/outreach/targets/x/events'],
  ['post', '/api/outreach/targets/x/do-not-contact'],
  ['post', '/api/outreach/targets/x/release'],
  ['post', '/api/outreach/publications'],
  ['get', '/api/outreach/publications'],
  ['get', '/api/outreach/templates'],
  ['post', '/api/outreach/templates'],
  ['get', '/api/outreach/templates/x'],
  ['patch', '/api/outreach/templates/x'],
  ['post', '/api/outreach/templates/x/archive'],
  ['post', '/api/outreach/templates/x/restore'],
  ['post', '/api/outreach/templates/x/duplicate'],
  ['delete', '/api/outreach/templates/x'],
  ['get', '/api/outreach/reports'],
  ['get', '/api/me/context'],
]

const ADMIN_ONLY_ROUTES: Array<[Method, string]> = [
  ['get', '/api/team/moderators'],
  ['post', '/api/team/moderators'],
  ['patch', '/api/team/moderators/x/password'],
  ['post', '/api/team/moderators/x/deactivate'],
  ['post', '/api/team/moderators/x/activate'],
  ['post', '/api/team/moderators/x/products'],
  ['delete', '/api/team/moderators/x/products/y'],
  ['get', '/api/team/targets'],
  ['post', '/api/team/transfer-targets'],
  ['get', '/api/reports'],
  ['get', '/api/products/admin'],
  ['post', '/api/products'],
  ['patch', '/api/products/x'],
  ['delete', '/api/products/x'],
  ['post', '/api/products/x/restore'],
  ['post', '/api/products/x/stripe-sync'],
]

// Адмін-ендпоінти в межах продукту: модератору заборонені, хоч він і в продукті.
const ADMIN_ONLY_IN_PRODUCT: Array<[Method, string]> = [
  ['post', '/api/outreach/targets/x/release'],
  ['delete', '/api/outreach/templates/x'],
]

const send = (method: Method, path: string, headers: Record<string, string> = {}) =>
  api()[method](path).set(headers).send({})

const setup = async () => {
  const admin = await createUser('admin', 'admin@test.io')
  await createUser('moderator', 'mod@test.io')
  await createUser('user', 'buyer@test.io')
  const mod = await prisma.user.findFirstOrThrow({ where: { email: 'mod@test.io' } })
  const product = await createProduct('A')
  await grant(mod.id, product.id, admin.id)
  return {
    product,
    admin: (await loginOk('admin@test.io')).accessToken,
    moderator: (await loginOk('mod@test.io')).accessToken,
    buyer: (await loginOk('buyer@test.io')).accessToken,
  }
}

describe('кожен ендпоінт журналу закритий від сторонніх', () => {
  it.each([...PRODUCT_ROUTES, ...ADMIN_ONLY_ROUTES])('%s %s без токена 401', async (method, path) => {
    const res = await send(method, path)

    expect(res.status).toBe(401)
  })

  it.each([...PRODUCT_ROUTES, ...ADMIN_ONLY_ROUTES])(
    '%s %s з невалідним токеном 401',
    async (method, path) => {
      const res = await send(method, path, { Authorization: 'Bearer not.a.token' })

      expect(res.status).toBe(401)
    }
  )

  it('покупець (role user) не потрапляє ні в журнал, ні в адмін-розділи', async () => {
    const { product, buyer } = await setup()

    for (const [method, path] of PRODUCT_ROUTES) {
      const res = await send(method, path, inProduct(buyer, product.id))
      expect(res.status, `${method} ${path}`).toBe(403)
    }
    for (const [method, path] of ADMIN_ONLY_ROUTES) {
      const res = await send(method, path, auth(buyer))
      expect(res.status, `${method} ${path}`).toBe(403)
    }
  })

  it('модератор не потрапляє в адмін-розділи й адмін-дії в продукті', async () => {
    const { product, moderator } = await setup()

    for (const [method, path] of ADMIN_ONLY_ROUTES) {
      const res = await send(method, path, auth(moderator))
      expect(res.status, `${method} ${path}`).toBe(403)
    }
    for (const [method, path] of ADMIN_ONLY_IN_PRODUCT) {
      const res = await send(method, path, inProduct(moderator, product.id))
      expect(res.status, `${method} ${path}`).toBe(403)
    }
  })

  it('чужий продукт закритий на всіх продуктових ендпоінтах', async () => {
    const { moderator } = await setup()
    const foreign = await createProduct('Foreign')

    for (const [method, path] of PRODUCT_ROUTES) {
      const res = await send(method, path, inProduct(moderator, foreign.id))
      expect(res.status, `${method} ${path}`).toBe(403)
    }
  })

  it('без заголовка продукту жоден продуктовий ендпоінт не працює', async () => {
    const { moderator } = await setup()

    for (const [method, path] of PRODUCT_ROUTES) {
      const res = await send(method, path, auth(moderator))
      expect(res.status, `${method} ${path}`).toBe(400)
    }
  })
})

describe('вхід: ліміт невдалих спроб', () => {
  it('після 10 невдалих спроб вхід блокується навіть із вірним паролем, інший e-mail не зачеплений', async () => {
    await createUser('moderator', 'victim@test.io')
    await createUser('moderator', 'other@test.io')

    for (let i = 0; i < 10; i++) {
      expect((await login('victim@test.io', 'wrong-password')).status).toBe(401)
    }

    const blocked = await login('victim@test.io', 'password-123')
    expect(blocked.status).toBe(429)
    expect((await login('other@test.io', 'password-123')).status).toBe(200)
  })

  it('успішні входи не лічаться', async () => {
    await createUser('moderator', 'steady@test.io')

    for (let i = 0; i < 15; i++) {
      expect((await login('steady@test.io', 'password-123')).status).toBe(200)
    }
  })

  it('регістр e-mail не дає обійти ліміт', async () => {
    await createUser('moderator', 'case@test.io')

    for (let i = 0; i < 10; i++) {
      await login(i % 2 ? 'CASE@test.io' : 'case@test.io', 'wrong-password')
    }

    expect((await login('Case@Test.io', 'password-123')).status).toBe(429)
  })
})

describe('логи без секретів', () => {
  it('redact прибирає хеші, паролі й токени з повідомлень помилок', async () => {
    const { redact } = await import('../src/shared/middlewares/errorHandler.js')
    const message = [
      'Invalid `prisma.user.create()` invocation:',
      '{ data: { email: "a@b.com", credentials: { create: { passwordHash: "$2b$10$abcdefghijklmnopqrstuv", password: \'plain-pass\' } } },',
      "refresh: { tokenHash: 'deadbeef1234' } }",
    ].join('\n')

    const cleaned = redact(new Error(message)) as Error

    expect(cleaned.message).not.toContain('$2b$10$abcdefghijklmnopqrstuv')
    expect(cleaned.message).not.toContain('plain-pass')
    expect(cleaned.message).not.toContain('deadbeef1234')
    expect(cleaned.message).toContain('a@b.com')
    expect(cleaned.message).toContain('[redacted]')
  })

  it('redact лишає імʼя й стек помилки, а не-помилки пропускає як є', async () => {
    const { redact } = await import('../src/shared/middlewares/errorHandler.js')
    const original = new TypeError('boom')

    const cleaned = redact(original) as Error

    expect(cleaned.name).toBe('TypeError')
    expect(cleaned.stack).toContain('boom')
    expect(redact('plain string')).toBe('plain string')
  })

  it('помилка при створенні модератора не пише пароль у лог', async () => {
    const { admin } = await setup()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const body = { email: 'dup@test.io', name: 'Dup', password: 'super-secret-pass' }

    await api().post('/api/team/moderators').set(auth(admin)).send(body).expect(201)
    await api().post('/api/team/moderators').set(auth(admin)).send(body)

    const logged = spy.mock.calls.map((call) => call.map(String).join(' ')).join('\n')
    spy.mockRestore()

    expect(logged).not.toContain('super-secret-pass')
    expect(logged).not.toMatch(/\$2[aby]\$\d\d\$/)
  })
})
