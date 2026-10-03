import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
import {
  addDays,
  bucketsOf,
  resolveRange,
  todayIn,
} from '../src/modules/reports/reports.range.js'
import {
  api,
  auth,
  createProduct,
  createUser,
  grant,
  inProduct,
  loginOk,
  resetDb,
} from './helpers.js'

describe('межі періодів (чиста логіка)', () => {
  const range = (period: 'day' | 'week' | 'month' | 'year', date: string) =>
    resolveRange({ period, date })

  it('день: одна доба', () => {
    expect(range('day', '2025-03-15')).toMatchObject({ from: '2025-03-15', to: '2025-03-16', days: 1 })
  })

  it('тиждень починається з понеділка, у тому числі для неділі й для понеділка', () => {
    expect(range('week', '2025-03-12')).toMatchObject({ from: '2025-03-10', to: '2025-03-17', days: 7 })
    expect(range('week', '2025-03-16')).toMatchObject({ from: '2025-03-10', to: '2025-03-17' })
    expect(range('week', '2025-03-10')).toMatchObject({ from: '2025-03-10', to: '2025-03-17' })
  })

  it('тиждень на межі місяців і років', () => {
    expect(range('week', '2025-01-01')).toMatchObject({ from: '2024-12-30', to: '2025-01-06' })
    expect(range('week', '2025-04-02')).toMatchObject({ from: '2025-03-31', to: '2025-04-07' })
  })

  it('місяць: різна довжина, високосний лютий, перехід грудня на січень', () => {
    expect(range('month', '2025-01-20')).toMatchObject({ from: '2025-01-01', to: '2025-02-01', days: 31 })
    expect(range('month', '2025-02-10').days).toBe(28)
    expect(range('month', '2024-02-10').days).toBe(29)
    expect(range('month', '2025-12-31')).toMatchObject({ from: '2025-12-01', to: '2026-01-01', days: 31 })
    expect(range('month', '2025-04-30').days).toBe(30)
  })

  it('рік: звичайний і високосний', () => {
    expect(range('year', '2025-07-04')).toMatchObject({ from: '2025-01-01', to: '2026-01-01', days: 365 })
    expect(range('year', '2024-07-04').days).toBe(366)
  })

  it('довільний період включає кінцевий день; ліміт 366 днів', () => {
    expect(resolveRange({ period: 'custom', date: '2025-01-01', from: '2025-03-01', to: '2025-03-31' })).toMatchObject({
      from: '2025-03-01',
      to: '2025-04-01',
      days: 31,
    })
    expect(resolveRange({ period: 'custom', date: '2025-01-01', from: '2024-01-01', to: '2024-12-31' }).days).toBe(366)
    expect(() => resolveRange({ period: 'custom', date: '2025-01-01', from: '2024-01-01', to: '2025-01-01' })).toThrow()
  })

  it('довільний період: порожні або перевернуті межі відхиляються', () => {
    expect(() => resolveRange({ period: 'custom', date: '2025-01-01' })).toThrow()
    expect(() => resolveRange({ period: 'custom', date: '2025-01-01', from: '2025-02-01', to: '2025-01-01' })).toThrow()
  })

  it('гранулярність: до 62 днів по днях, довше по місяцях', () => {
    expect(range('month', '2025-01-10').granularity).toBe('day')
    expect(range('year', '2025-01-10').granularity).toBe('month')
    expect(bucketsOf(range('month', '2025-02-10'))).toHaveLength(28)
    expect(bucketsOf(range('year', '2025-02-10'))).toEqual(
      Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, '0')}-01`)
    )
  })

  it('addDays переходить через місяць і рік', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28')
  })

  it('сьогодні береться в часовому поясі, а не в UTC', () => {
    const now = new Date('2025-12-31T22:30:00Z')
    expect(todayIn('UTC', now)).toBe('2025-12-31')
    expect(todayIn('Europe/Kyiv', now)).toBe('2026-01-01')
  })
})

beforeEach(resetDb)

let urlCounter = 0
const targetCache = new Map<string, string>()

const seedEvent = async (params: {
  productId: string
  userId: string
  type: 'first' | 'repeat' | 'reply' | 'publication' | 'status'
  at: string
  channel?: string | null
}) => {
  const base = {
    productId: params.productId,
    userId: params.userId,
    type: params.type,
    channel: params.channel === undefined ? 'telegram' : params.channel,
    occurredAt: new Date(params.at),
  }

  if (params.type === 'publication') {
    urlCounter += 1
    return prisma.outreachEvent.create({
      data: {
        ...base,
        publicationKind: 'post',
        url: `https://x.com/p/${urlCounter}`,
        urlNormalized: `x.com/p/${urlCounter}`,
      },
    })
  }

  const key = `${params.productId}:${params.userId}`
  let targetId = targetCache.get(key)
  if (!targetId) {
    targetId = (
      await prisma.outreachTarget.create({
        data: { productId: params.productId, ownerUserId: params.userId, displayName: 'T' },
      })
    ).id
    targetCache.set(key, targetId)
  }

  return prisma.outreachEvent.create({ data: { ...base, targetId } })
}

const setup = async () => {
  targetCache.clear()
  const admin = await createUser('admin', 'admin@test.io')
  const anna = await createUser('moderator', 'anna@test.io')
  const ivan = await createUser('moderator', 'ivan@test.io')
  const productA = await createProduct('Alpha')
  const productB = await createProduct('Beta')
  await grant(anna.id, productA.id, admin.id)
  await grant(ivan.id, productA.id, admin.id)
  await grant(ivan.id, productB.id, admin.id)
  const tokens = {
    admin: (await loginOk('admin@test.io')).accessToken,
    anna: (await loginOk('anna@test.io')).accessToken,
    ivan: (await loginOk('ivan@test.io')).accessToken,
  }
  return { admin, anna, ivan, productA, productB, tokens }
}

const report = (token: string, productId: string, query: Record<string, string>) =>
  api().get('/api/outreach/reports').query(query).set(inProduct(token, productId))

const adminReport = (token: string, query: Record<string, string>) =>
  api().get('/api/reports').query(query).set(auth(token))

describe('межі діб у часовому поясі (Europe/Kyiv)', () => {
  it('подія о 23:30 за Києва 31 грудня лежить у грудні, а о 00:00 уже в січні', async () => {
    const { anna, productA, tokens } = await setup()
    // Київ узимку UTC+2: 21:59:59Z = 23:59:59 31 грудня, 22:00:00Z = 00:00:00 1 січня.
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-12-31T21:59:59Z' })
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-12-31T22:00:00Z' })

    const dec31 = await report(tokens.anna, productA.id, { period: 'day', date: '2025-12-31' })
    const jan1 = await report(tokens.anna, productA.id, { period: 'day', date: '2026-01-01' })

    expect(dec31.body.totals.first).toBe(1)
    expect(jan1.body.totals.first).toBe(1)
  })

  it('перехід на літній час (30 березня 2025): доба має 23 години, межі не зсуваються', async () => {
    const { anna, productA, tokens } = await setup()
    const at = (iso: string) => seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: iso })
    // 29.03 22:00Z = 30.03 00:00 EET; 30.03 20:59Z = 30.03 23:59 EEST; 30.03 21:00Z = 31.03 00:00 EEST.
    await at('2025-03-29T21:59:59Z')
    await at('2025-03-29T22:00:00Z')
    await at('2025-03-30T20:59:59Z')
    await at('2025-03-30T21:00:00Z')

    const mar29 = await report(tokens.anna, productA.id, { period: 'day', date: '2025-03-29' })
    const mar30 = await report(tokens.anna, productA.id, { period: 'day', date: '2025-03-30' })
    const mar31 = await report(tokens.anna, productA.id, { period: 'day', date: '2025-03-31' })

    expect(mar29.body.totals.first).toBe(1)
    expect(mar30.body.totals.first).toBe(2)
    expect(mar31.body.totals.first).toBe(1)
  })

  it('місяць на межі: подія перед північчю останнього дня й одразу після', async () => {
    const { anna, productA, tokens } = await setup()
    // Київ влітку UTC+3: 30.06 20:59:59Z = 30.06 23:59:59; 20:00:00Z+1s... 21:00:00Z = 01.07 00:00.
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-06-30T20:59:59Z' })
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-06-30T21:00:00Z' })

    const june = await report(tokens.anna, productA.id, { period: 'month', date: '2025-06-15' })
    const july = await report(tokens.anna, productA.id, { period: 'month', date: '2025-07-15' })

    expect(june.body.totals.first).toBe(1)
    expect(july.body.totals.first).toBe(1)
    expect(june.body.range).toMatchObject({ from: '2025-06-01', to: '2025-06-30', granularity: 'day', timeZone: 'Europe/Kyiv' })
  })

  it('кошики графіка йдуть за місцевими датами', async () => {
    const { anna, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-05-10T21:30:00Z' })

    const res = await report(tokens.anna, productA.id, { period: 'week', date: '2025-05-08' })

    const bucket = res.body.series.find((b: { first: number }) => b.first === 1)
    // 21:30Z у травні це 00:30 наступної доби за Києва.
    expect(bucket.bucket).toBe('2025-05-11')
  })
})

describe('звіт збігається з таблицею подій', () => {
  it('підсумки, ряд, канали й модератори збігаються з прямим підрахунком', async () => {
    const { anna, ivan, productA, tokens } = await setup()
    const plan: Array<[string, 'first' | 'repeat' | 'reply' | 'publication', string, string | null]> = [
      [anna.id, 'first', '2025-03-10T08:00:00Z', 'telegram'],
      [anna.id, 'repeat', '2025-03-11T08:00:00Z', 'email'],
      [anna.id, 'repeat', '2025-03-11T09:00:00Z', 'email'],
      [anna.id, 'reply', '2025-03-12T08:00:00Z', 'email'],
      [ivan.id, 'first', '2025-03-12T10:00:00Z', 'linkedin'],
      [ivan.id, 'first', '2025-03-16T10:00:00Z', 'telegram'],
      [ivan.id, 'publication', '2025-03-14T10:00:00Z', 'tiktok'],
      [ivan.id, 'publication', '2025-03-15T10:00:00Z', 'x'],
      [anna.id, 'publication', '2025-03-15T11:00:00Z', null],
    ]
    for (const [userId, type, at, channel] of plan) {
      await seedEvent({ productId: productA.id, userId, type, at, channel })
    }
    // Поза тижнем і з іншим продуктом: у звіт не потрапляють.
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-03-17T08:00:00Z' })

    const res = await report(tokens.admin, productA.id, { period: 'week', date: '2025-03-12' })

    expect(res.status).toBe(200)
    expect(res.body.range).toMatchObject({ from: '2025-03-10', to: '2025-03-16', days: 7 })
    expect(res.body.totals).toMatchObject({ first: 3, repeat: 2, reply: 1, publication: 3, contacts: 5, total: 9 })

    // Звірка з таблицею: те саме число рядків за тим самим вікном.
    const direct = await prisma.outreachEvent.count({
      where: {
        productId: productA.id,
        occurredAt: { gte: new Date('2025-03-09T22:00:00Z'), lt: new Date('2025-03-16T22:00:00Z') },
      },
    })
    expect(res.body.totals.total).toBe(direct)

    expect(res.body.series).toHaveLength(7)
    expect(res.body.series.reduce((s: number, b: { total: number }) => s + b.total, 0)).toBe(9)

    const channels = Object.fromEntries(
      res.body.byChannel.map((c: { channel: string; total: number }) => [c.channel, c.total])
    )
    expect(channels).toEqual({ telegram: 2, email: 3, linkedin: 1, tiktok: 1, x: 1, unspecified: 1 })

    const moderators = Object.fromEntries(
      res.body.byModerator.map((m: { name: string; total: number }) => [m.name, m.total])
    )
    expect(moderators).toEqual({ anna: 5, ivan: 4 })
  })

  it('публікації рахуються окремо від звернень', async () => {
    const { anna, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-03-10T08:00:00Z' })
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'publication', at: '2025-03-10T09:00:00Z' })

    const res = await report(tokens.anna, productA.id, { period: 'day', date: '2025-03-10' })

    expect(res.body.totals).toMatchObject({ contacts: 1, publication: 1, total: 2 })
  })

  it('внутрішні події status ніколи не потрапляють у звіт', async () => {
    const { anna, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'status', at: '2025-03-10T08:00:00Z' })

    const res = await report(tokens.anna, productA.id, { period: 'day', date: '2025-03-10' })

    expect(res.body.totals.total).toBe(0)
  })

  it('фільтр за типами звужує всі розрізи', async () => {
    const { anna, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-03-10T08:00:00Z' })
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'reply', at: '2025-03-10T09:00:00Z', channel: 'email' })
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'publication', at: '2025-03-10T10:00:00Z' })

    const res = await report(tokens.admin, productA.id, { period: 'day', date: '2025-03-10', types: 'reply,publication' })

    expect(res.body.totals).toMatchObject({ first: 0, reply: 1, publication: 1, total: 2 })
    expect(res.body.byChannel.reduce((s: number, c: { total: number }) => s + c.total, 0)).toBe(2)
    expect(res.body.byModerator[0].total).toBe(2)
  })

  it('рік по місяцях: 12 кошиків, порожні з нулями', async () => {
    const { anna, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-02-10T08:00:00Z' })
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-11-10T08:00:00Z' })

    const res = await report(tokens.anna, productA.id, { period: 'year', date: '2025-06-01' })

    expect(res.body.range.granularity).toBe('month')
    expect(res.body.series).toHaveLength(12)
    expect(res.body.series[1]).toMatchObject({ bucket: '2025-02-01', first: 1 })
    expect(res.body.series[10]).toMatchObject({ bucket: '2025-11-01', first: 1 })
    expect(res.body.series[0].total).toBe(0)
  })

  it('довільний період: межі включно, діапазон за лімітом відхиляється', async () => {
    const { anna, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-03-01T10:00:00Z' })
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-03-31T10:00:00Z' })
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-04-01T10:00:00Z' })

    const ok = await report(tokens.anna, productA.id, { period: 'custom', from: '2025-03-01', to: '2025-03-31' })
    expect(ok.body.totals.first).toBe(2)

    const tooBig = await report(tokens.anna, productA.id, { period: 'custom', from: '2024-01-01', to: '2025-06-01' })
    expect(tooBig.status).toBe(400)
    expect(tooBig.body.code).toBe('RANGE_TOO_LARGE')

    expect((await report(tokens.anna, productA.id, { period: 'custom', from: '2025-03-10' })).status).toBe(400)
    expect((await report(tokens.anna, productA.id, { period: 'custom', from: '2025-03-10', to: '2025-03-01' })).status).toBe(400)
  })

  it('некоректна дата, період чи тип дають 400', async () => {
    const { productA, tokens } = await setup()

    expect((await report(tokens.anna, productA.id, { date: '2025-02-30' })).status).toBe(400)
    expect((await report(tokens.anna, productA.id, { date: 'yesterday' })).status).toBe(400)
    expect((await report(tokens.anna, productA.id, { period: 'decade' })).status).toBe(400)
    expect((await report(tokens.anna, productA.id, { types: 'first,status' })).status).toBe(400)
  })

  it('без дати береться сьогодні за часовим поясом звіту', async () => {
    const { productA, tokens } = await setup()

    const res = await report(tokens.anna, productA.id, { period: 'day' })

    expect(res.body.range.from).toBe(todayIn('Europe/Kyiv'))
  })
})

describe('доступ до звітів', () => {
  it('модератор бачить лише свої події й не бачить розбивки за модераторами', async () => {
    const { anna, ivan, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-03-10T08:00:00Z' })
    await seedEvent({ productId: productA.id, userId: ivan.id, type: 'first', at: '2025-03-10T09:00:00Z' })
    await seedEvent({ productId: productA.id, userId: ivan.id, type: 'first', at: '2025-03-10T10:00:00Z' })

    const res = await report(tokens.anna, productA.id, { period: 'day', date: '2025-03-10' })

    expect(res.body.totals.first).toBe(1)
    expect(res.body.byModerator).toBeUndefined()
    expect(res.body.byProduct).toBeUndefined()
  })

  it('модератор не може підмінити userId, щоб побачити чужі цифри', async () => {
    const { anna, ivan, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: ivan.id, type: 'first', at: '2025-03-10T09:00:00Z' })

    const res = await report(tokens.anna, productA.id, { period: 'day', date: '2025-03-10', userId: ivan.id })

    expect(res.body.totals.first).toBe(0)
    expect(anna.id).not.toBe(ivan.id)
  })

  it('адмін у продукті звужує звіт до одного модератора', async () => {
    const { anna, ivan, productA, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-03-10T08:00:00Z' })
    await seedEvent({ productId: productA.id, userId: ivan.id, type: 'first', at: '2025-03-10T09:00:00Z' })

    const res = await report(tokens.admin, productA.id, { period: 'day', date: '2025-03-10', userId: ivan.id })

    expect(res.body.totals.first).toBe(1)
    expect(res.body.byModerator.map((m: { name: string }) => m.name)).toEqual(['ivan'])
  })

  it('модератор продукту A не бачить звіт продукту B (403), невідомий 404', async () => {
    const { productB, tokens } = await setup()

    expect((await report(tokens.anna, productB.id, { period: 'day' })).status).toBe(403)
    expect((await report(tokens.anna, 'missing', { period: 'day' })).status).toBe(404)
  })

  it('звіт продукту не включає події іншого продукту', async () => {
    const { ivan, productA, productB, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: ivan.id, type: 'first', at: '2025-03-10T08:00:00Z' })
    await seedEvent({ productId: productB.id, userId: ivan.id, type: 'first', at: '2025-03-10T09:00:00Z' })

    const res = await report(tokens.ivan, productA.id, { period: 'day', date: '2025-03-10' })

    expect(res.body.totals.first).toBe(1)
  })

  it('«Усі продукти»: адмін бачить суму й розбивку за продуктами та модераторами', async () => {
    const { anna, ivan, productA, productB, tokens } = await setup()
    await seedEvent({ productId: productA.id, userId: anna.id, type: 'first', at: '2025-03-10T08:00:00Z' })
    await seedEvent({ productId: productA.id, userId: ivan.id, type: 'repeat', at: '2025-03-10T09:00:00Z' })
    await seedEvent({ productId: productB.id, userId: ivan.id, type: 'first', at: '2025-03-10T10:00:00Z' })
    await seedEvent({ productId: productB.id, userId: ivan.id, type: 'publication', at: '2025-03-10T11:00:00Z' })

    const all = await adminReport(tokens.admin, { period: 'day', date: '2025-03-10' })

    expect(all.status).toBe(200)
    expect(all.body.totals.total).toBe(4)
    const products = Object.fromEntries(all.body.byProduct.map((p: { name: string; total: number }) => [p.name, p.total]))
    expect(Object.values(products).sort()).toEqual([2, 2])
    expect(all.body.byModerator.map((m: { name: string; total: number }) => [m.name, m.total])).toEqual([
      ['ivan', 3],
      ['anna', 1],
    ])

    const onlyB = await adminReport(tokens.admin, { period: 'day', date: '2025-03-10', productId: productB.id })
    expect(onlyB.body.totals.total).toBe(2)
    expect(onlyB.body.byProduct).toBeUndefined()

    expect((await adminReport(tokens.admin, { productId: 'missing' })).status).toBe(404)
  })

  it('звіт по всіх продуктах закритий для модераторів і покупців, без токена 401', async () => {
    await setup()
    await createUser('user', 'buyer@test.io')
    const buyer = await loginOk('buyer@test.io')

    expect((await api().get('/api/reports')).status).toBe(401)
    expect((await adminReport((await loginOk('anna@test.io')).accessToken, {})).status).toBe(403)
    expect((await adminReport(buyer.accessToken, {})).status).toBe(403)
  })

  it('покупець (role user) не має звіту по продукту', async () => {
    const { productA } = await setup()
    const buyer = await loginOk((await createUser('user', 'buyer2@test.io')).email)

    expect((await report(buyer.accessToken, productA.id, {})).status).toBe(403)
  })
})
