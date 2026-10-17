import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
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

beforeEach(resetDb)

const DAY = 24 * 60 * 60 * 1000
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString()

const setup = async () => {
  const admin = await createUser('admin', 'admin@test.io')
  const anna = await createUser('moderator', 'anna@test.io')
  const ivan = await createUser('moderator', 'ivan@test.io')
  const product = await createProduct('A')
  await grant(anna.id, product.id, admin.id)
  await grant(ivan.id, product.id, admin.id)
  const tokens = {
    admin: (await loginOk('admin@test.io')).accessToken,
    anna: (await loginOk('anna@test.io')).accessToken,
    ivan: (await loginOk('ivan@test.io')).accessToken,
  }
  return { admin, anna, ivan, product, tokens }
}

const register = async (
  token: string,
  productId: string,
  body: Record<string, unknown>
) => {
  const res = await api()
    .post('/api/outreach/targets')
    .set(inProduct(token, productId))
    .send(body)
  expect(res.status).toBe(201)
  return res.body.target as { id: string }
}

const event = (
  token: string,
  productId: string,
  targetId: string,
  body: Record<string, unknown>
) =>
  api()
    .post(`/api/outreach/targets/${targetId}/events`)
    .set(inProduct(token, productId))
    .send(body)

const list = (
  token: string,
  productId: string,
  query: Record<string, string> = {}
) =>
  api()
    .get('/api/outreach/targets')
    .query(query)
    .set(inProduct(token, productId))

const names = (res: { body: { targets: { displayName: string }[] } }) =>
  res.body.targets.map((target) => target.displayName).sort()

describe('чисті дані журналу', () => {
  it('повтор і відповідь без каналу отримують канал основного ідентифікатора', async () => {
    const { product, tokens } = await setup()
    const target = await register(tokens.anna, product.id, {
      value: 'lead@company.com',
    })

    expect(
      (await event(tokens.anna, product.id, target.id, { type: 'repeat' }))
        .status
    ).toBe(201)
    expect(
      (await event(tokens.anna, product.id, target.id, { type: 'reply' }))
        .status
    ).toBe(201)
    expect(
      (
        await event(tokens.anna, product.id, target.id, {
          type: 'repeat',
          channel: 'telegram',
        })
      ).status
    ).toBe(201)

    const events = await prisma.outreachEvent.findMany({
      where: { targetId: target.id },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.map((e) => [e.type, e.channel])).toEqual([
      ['first', 'email'],
      ['repeat', 'email'],
      ['reply', 'email'],
      ['repeat', 'telegram'],
    ])
  })

  it('перший контакт можна внести заднім числом, але не з майбутнього', async () => {
    const { product, tokens } = await setup()
    const when = ago(2)
    const target = await register(tokens.anna, product.id, {
      value: '@yesterday_lead',
      occurredAt: when,
    })

    const saved = await prisma.outreachTarget.findUniqueOrThrow({
      where: { id: target.id },
    })
    expect(saved.firstContactedAt?.toISOString()).toBe(when)
    expect(saved.lastContactedAt?.toISOString()).toBe(when)
    const first = await prisma.outreachEvent.findFirstOrThrow({
      where: { targetId: target.id, type: 'first' },
    })
    expect(first.occurredAt.toISOString()).toBe(when)

    const future = await api()
      .post('/api/outreach/targets')
      .set(inProduct(tokens.anna, product.id))
      .send({
        value: '@future_lead',
        occurredAt: new Date(Date.now() + 2 * DAY).toISOString(),
      })
    expect(future.status).toBe(400)
  })
})

// Анна: стара без відповіді (закинута), свіжа без відповіді, з відповіддю (чекає нашої відповіді),
// з відповіддю, на яку вже відповіли, і "не писати". Іван: одна своя.
const seedStates = async () => {
  const ctx = await setup()
  const { product, tokens } = ctx
  const stale = await register(tokens.anna, product.id, {
    value: '@stale_lead',
    displayName: 'Stale',
    occurredAt: ago(10),
  })
  await register(tokens.anna, product.id, {
    value: '@fresh_lead',
    displayName: 'Fresh',
  })
  const answered = await register(tokens.anna, product.id, {
    value: 'answered@corp.com',
    displayName: 'Answered',
    occurredAt: ago(5),
  })
  await event(tokens.anna, product.id, answered.id, {
    type: 'reply',
    occurredAt: ago(1),
  })
  const handled = await register(tokens.anna, product.id, {
    value: '@handled_lead',
    displayName: 'Handled',
    occurredAt: ago(6),
  })
  await event(tokens.anna, product.id, handled.id, {
    type: 'reply',
    occurredAt: ago(4),
  })
  await event(tokens.anna, product.id, handled.id, {
    type: 'repeat',
    occurredAt: ago(3),
  })
  const blocked = await register(tokens.anna, product.id, {
    value: '@blocked_lead',
    displayName: 'Blocked',
    occurredAt: ago(8),
  })
  await api()
    .post(`/api/outreach/targets/${blocked.id}/do-not-contact`)
    .set(inProduct(tokens.anna, product.id))
    .send({ reason: 'asked to stop' })
  await register(tokens.ivan, product.id, {
    value: '@ivan_lead',
    displayName: '=HYPERLINK("x")',
    occurredAt: ago(9),
  })
  return { ...ctx, stale }
}

describe('список цілей: стани, пошук і власник', () => {
  it('фільтрує за станом роботи', async () => {
    const { product, tokens } = await seedStates()

    expect(names(await list(tokens.anna, product.id))).toEqual([
      'Answered',
      'Blocked',
      'Fresh',
      'Handled',
      'Stale',
    ])
    expect(
      names(await list(tokens.anna, product.id, { state: 'awaiting' }))
    ).toEqual(['Fresh', 'Stale'])
    expect(
      names(await list(tokens.anna, product.id, { state: 'followUp' }))
    ).toEqual(['Stale'])
    expect(
      names(await list(tokens.anna, product.id, { state: 'needsAnswer' }))
    ).toEqual(['Answered'])
    expect(
      names(await list(tokens.anna, product.id, { state: 'replied' }))
    ).toEqual(['Answered', 'Handled'])
    expect(
      names(await list(tokens.anna, product.id, { state: 'doNotContact' }))
    ).toEqual(['Blocked'])

    const answered = (await list(tokens.anna, product.id, { state: 'replied' }))
      .body.targets[0]
    expect(answered.lastReplyAt).not.toBeNull()
  })

  it('шукає за назвою й ідентифікатором, фільтрує за каналом', async () => {
    const { product, tokens } = await seedStates()

    expect(names(await list(tokens.anna, product.id, { q: 'stale' }))).toEqual([
      'Stale',
    ])
    expect(
      names(await list(tokens.anna, product.id, { q: '@handled_lead' }))
    ).toEqual(['Handled'])
    expect(
      names(await list(tokens.anna, product.id, { q: 'corp.com' }))
    ).toEqual(['Answered'])
    expect(
      names(await list(tokens.anna, product.id, { channel: 'email' }))
    ).toEqual(['Answered'])
  })

  it('адмін бачить усіх і може звузити до модератора; модератор чужих не бачить', async () => {
    const { product, tokens, ivan } = await seedStates()

    expect((await list(tokens.admin, product.id)).body.targets).toHaveLength(6)
    expect(
      names(await list(tokens.admin, product.id, { ownerUserId: ivan.id }))
    ).toEqual(['=HYPERLINK("x")'])
    // Модератор не може підглянути чужі цілі через ownerUserId.
    expect(
      (await list(tokens.anna, product.id, { ownerUserId: ivan.id })).body
        .targets
    ).toHaveLength(5)
    expect(
      (await list(tokens.anna, product.id, { state: 'bogus' })).status
    ).toBe(400)
  })
})

describe('вивантаження CSV', () => {
  it('віддає CSV з тими самими фільтрами й нейтралізує формули', async () => {
    const { product, tokens } = await seedStates()

    const all = await api()
      .get('/api/outreach/targets/export')
      .set(inProduct(tokens.admin, product.id))
    expect(all.status).toBe(200)
    expect(all.headers['content-type']).toContain('text/csv')
    const lines = all.text.replace(/^﻿/, '').trim().split('\r\n')
    expect(lines[0]).toBe(
      'name,owner,state,identifiers,first_contact,last_contact,last_reply,replies,do_not_contact_reason'
    )
    expect(lines).toHaveLength(7)
    expect(all.text).toContain(`"'=HYPERLINK(""x"")"`)
    expect(all.text).toContain('needs_answer')
    expect(all.text).toContain('asked to stop')

    const mine = await api()
      .get('/api/outreach/targets/export')
      .query({ state: 'followUp' })
      .set(inProduct(tokens.anna, product.id))
    const mineLines = mine.text.trim().split('\r\n')
    expect(mineLines).toHaveLength(2)
    expect(mineLines[1]).toContain('Stale')
  })
})

describe('"Потребує дії": зведення', () => {
  it('модератор бачить лише себе, адмін усіх', async () => {
    const { product, tokens } = await seedStates()

    const mine = await api()
      .get('/api/outreach/targets/summary')
      .set(inProduct(tokens.anna, product.id))
    expect(mine.status).toBe(200)
    expect(mine.body.totals).toEqual({
      total: 5,
      awaiting: 2,
      followUp: 1,
      needsAnswer: 1,
      replied: 2,
      doNotContact: 1,
    })
    expect(mine.body.byOwner).toHaveLength(1)
    expect(mine.body.followUpDays).toBe(3)

    const team = await api()
      .get('/api/outreach/targets/summary')
      .set(inProduct(tokens.admin, product.id))
    expect(team.body.totals.total).toBe(6)
    expect(team.body.totals.followUp).toBe(2)
    expect(
      team.body.byOwner.map((row: { name: string }) => row.name).sort()
    ).toEqual(['anna', 'ivan'])

    const global = await api()
      .get('/api/reports/follow-ups')
      .set(auth(tokens.admin))
    expect(global.status).toBe(200)
    expect(global.body.totals.followUp).toBe(2)
    expect(
      global.body.actionItems
        .map((row: { name: string; followUp: number; needsAnswer: number }) => [
          row.name,
          row.followUp,
          row.needsAnswer,
        ])
        .sort()
    ).toEqual([
      ['anna', 1, 1],
      ['ivan', 1, 0],
    ])
    expect(typeof global.body.actionItems[0].productName).toBe('string')
    expect(
      (await api().get('/api/reports/follow-ups').set(auth(tokens.anna))).status
    ).toBe(403)
  })
})

describe('звіт: шаблони', () => {
  it('рахує використання і відповіді після звернення з шаблоном', async () => {
    const { product, tokens } = await setup()
    const created = await api()
      .post('/api/outreach/templates')
      .set(inProduct(tokens.anna, product.id))
      .send({ channel: 'any', title: 'Intro', body: 'Hi {{name}}' })
    expect(created.status).toBe(201)
    const templateId = created.body.template.id

    const a = await register(tokens.anna, product.id, {
      value: '@tpl_a',
      templateId,
    })
    await register(tokens.anna, product.id, { value: '@tpl_b', templateId })
    await register(tokens.anna, product.id, { value: '@no_tpl' })
    await event(tokens.anna, product.id, a.id, { type: 'reply' })

    const report = await api()
      .get('/api/outreach/reports')
      .query({ period: 'week' })
      .set(inProduct(tokens.anna, product.id))
    expect(report.status).toBe(200)
    expect(report.body.byTemplate).toEqual([
      { id: templateId, title: 'Intro', uses: 2, targets: 2, replied: 1 },
    ])
  })
})
