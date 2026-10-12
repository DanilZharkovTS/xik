import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  createProduct,
  createUser,
  grant,
  inProduct,
  loginOk,
  resetDb,
} from './helpers.js'

beforeEach(resetDb)

const setup = async () => {
  const admin = await createUser('admin', 'admin@test.io')
  const anna = await createUser('moderator', 'anna@test.io')
  const ivan = await createUser('moderator', 'ivan@test.io')
  const product = await createProduct('A')
  const other = await createProduct('B')
  await grant(anna.id, product.id, admin.id)
  await grant(ivan.id, product.id, admin.id)
  await grant(anna.id, other.id, admin.id)
  const tokens = {
    admin: (await loginOk('admin@test.io')).accessToken,
    anna: (await loginOk('anna@test.io')).accessToken,
    ivan: (await loginOk('ivan@test.io')).accessToken,
  }
  return { admin, anna, ivan, product, other, tokens }
}

const create = (
  token: string,
  productId: string,
  body: Record<string, unknown>
) =>
  api()
    .post('/api/outreach/templates')
    .set(inProduct(token, productId))
    .send(body)

const NEW_TEMPLATE = {
  channel: 'email',
  title: 'Intro email',
  subject: 'Hello {{name}}',
  body: 'Hi {{name}}, I am {{manager_name}} from {{product_name}}. See {{product_link}}',
}

const patch = (
  token: string,
  productId: string,
  id: string,
  body: Record<string, unknown>
) =>
  api()
    .patch(`/api/outreach/templates/${id}`)
    .set(inProduct(token, productId))
    .send(body)

const post = (token: string, productId: string, path: string) =>
  api()
    .post(`/api/outreach/templates/${path}`)
    .set(inProduct(token, productId))
    .send({})

const list = (
  token: string,
  productId: string,
  query: Record<string, string> = {}
) =>
  api()
    .get('/api/outreach/templates')
    .query(query)
    .set(inProduct(token, productId))

describe('створення і валідація', () => {
  it('створює шаблон з версією 1 і правами власника', async () => {
    const { product, tokens } = await setup()

    const res = await create(tokens.anna, product.id, NEW_TEMPLATE)

    expect(res.status).toBe(201)
    expect(res.body.template).toMatchObject({
      channel: 'email',
      title: 'Intro email',
      subject: 'Hello {{name}}',
      version: 1,
      status: 'active',
      isMine: true,
      owner: { name: 'anna' },
    })
    expect(res.body.template.permissions).toMatchObject({
      canEdit: true,
      canArchive: true,
      canDuplicate: true,
      canDelete: false,
    })
  })

  it('невідома змінна відхиляється з підказкою', async () => {
    const { product, tokens } = await setup()

    const res = await create(tokens.anna, product.id, {
      ...NEW_TEMPLATE,
      body: 'Hi {{nmae}}',
    })

    expect(res.status).toBe(400)
    expect(JSON.stringify(res.body)).toContain('{{nmae}}')
    expect(await prisma.outreachTemplate.count()).toBe(0)
  })

  it('тема зберігається лише для email та any, для інших очищується', async () => {
    const { product, tokens } = await setup()

    const telegram = await create(tokens.anna, product.id, {
      channel: 'telegram',
      title: 'TG',
      subject: 'ignored',
      body: 'text',
    })
    const any = await create(tokens.anna, product.id, {
      channel: 'any',
      title: 'Universal',
      subject: 'kept',
      body: 'text',
    })

    expect(telegram.body.template.subject).toBeNull()
    expect(any.body.template.subject).toBe('kept')
  })

  it.each([
    [{ channel: 'fax' }],
    [{ title: '' }],
    [{ body: '' }],
    [{ body: 'x'.repeat(5001) }],
    [{ title: 'x'.repeat(101) }],
  ])('некоректні дані %j дають 400', async (override) => {
    const { product, tokens } = await setup()

    expect(
      (await create(tokens.anna, product.id, { ...NEW_TEMPLATE, ...override }))
        .status
    ).toBe(400)
  })

  it('продукт у тілі ігнорується, шаблон належить продукту із заголовка', async () => {
    const { product, other, tokens } = await setup()

    await create(tokens.anna, product.id, {
      ...NEW_TEMPLATE,
      productId: other.id,
    }).expect(201)

    expect((await prisma.outreachTemplate.findFirstOrThrow()).productId).toBe(
      product.id
    )
  })
})

describe('список і видимість', () => {
  it('активні шаблони продукту бачать усі модератори, інший продукт ні', async () => {
    const { product, other, tokens } = await setup()
    await create(tokens.anna, product.id, NEW_TEMPLATE).expect(201)
    await create(tokens.anna, other.id, {
      ...NEW_TEMPLATE,
      title: 'Other product',
    }).expect(201)

    const forIvan = await list(tokens.ivan, product.id)
    expect(
      forIvan.body.templates.map((t: { title: string }) => t.title)
    ).toEqual(['Intro email'])
    expect(forIvan.body.templates[0].isMine).toBe(false)
    expect(forIvan.body.templates[0].permissions.canEdit).toBe(false)

    expect((await list(tokens.ivan, other.id)).status).toBe(403)
  })

  it('фільтр за каналом включає універсальні шаблони', async () => {
    const { product, tokens } = await setup()
    await create(tokens.anna, product.id, {
      channel: 'telegram',
      title: 'TG',
      body: 'a',
    })
    await create(tokens.anna, product.id, {
      channel: 'email',
      title: 'Mail',
      body: 'b',
    })
    await create(tokens.anna, product.id, {
      channel: 'any',
      title: 'Any',
      body: 'c',
    })

    const res = await list(tokens.ivan, product.id, { channel: 'telegram' })

    expect(
      res.body.templates.map((t: { title: string }) => t.title).sort()
    ).toEqual(['Any', 'TG'])
  })

  it('архівні: власник бачить свої, чужий модератор ні, адмін усі', async () => {
    const { product, tokens } = await setup()
    const created = await create(tokens.anna, product.id, NEW_TEMPLATE)
    const id = created.body.template.id
    await post(tokens.anna, product.id, `${id}/archive`).expect(200)

    expect((await list(tokens.anna, product.id)).body.templates).toHaveLength(0)
    expect(
      (await list(tokens.anna, product.id, { status: 'archived' })).body
        .templates
    ).toHaveLength(1)
    expect(
      (await list(tokens.ivan, product.id, { status: 'archived' })).body
        .templates
    ).toHaveLength(0)
    expect(
      (await list(tokens.admin, product.id, { status: 'archived' })).body
        .templates
    ).toHaveLength(1)

    expect(
      (
        await api()
          .get(`/api/outreach/templates/${id}`)
          .set(inProduct(tokens.ivan, product.id))
      ).status
    ).toBe(404)
    expect(
      (
        await api()
          .get(`/api/outreach/templates/${id}`)
          .set(inProduct(tokens.anna, product.id))
      ).status
    ).toBe(200)
  })

  it('шаблон іншого продукту недоступний за id', async () => {
    const { product, other, tokens } = await setup()
    const created = await create(tokens.anna, other.id, NEW_TEMPLATE)

    const res = await api()
      .get(`/api/outreach/templates/${created.body.template.id}`)
      .set(inProduct(tokens.admin, product.id))

    expect(res.status).toBe(404)
  })
})

describe('права: варіант А', () => {
  it('власник правити може, чужий модератор ні (403), адмін може', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id

    expect(
      (
        await patch(tokens.ivan, product.id, id, {
          expectedVersion: 1,
          body: 'hacked',
        })
      ).status
    ).toBe(403)
    expect(
      (await prisma.outreachTemplate.findUniqueOrThrow({ where: { id } })).body
    ).toBe(NEW_TEMPLATE.body)

    expect(
      (
        await patch(tokens.anna, product.id, id, {
          expectedVersion: 1,
          body: 'by owner',
        })
      ).status
    ).toBe(200)
    expect(
      (
        await patch(tokens.admin, product.id, id, {
          expectedVersion: 2,
          body: 'by admin',
        })
      ).status
    ).toBe(200)
  })

  it('чужий шаблон можна лише дублювати: копія належить дублювальнику, версія 1', async () => {
    const { ivan, product, tokens } = await setup()
    const original = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template

    const res = await post(tokens.ivan, product.id, `${original.id}/duplicate`)

    expect(res.status).toBe(201)
    expect(res.body.template).toMatchObject({
      title: 'Copy of Intro email',
      body: original.body,
      version: 1,
      isMine: true,
    })
    expect(res.body.template.id).not.toBe(original.id)
    expect(
      (
        await prisma.outreachTemplate.findUniqueOrThrow({
          where: { id: res.body.template.id },
        })
      ).ownerUserId
    ).toBe(ivan.id)

    const edit = await patch(tokens.ivan, product.id, res.body.template.id, {
      expectedVersion: 1,
      body: 'mine now',
    })
    expect(edit.status).toBe(200)
  })

  it('архівувати може власник і адмін, чужий модератор ні', async () => {
    const { product, tokens } = await setup()
    const first = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id
    const second = (
      await create(tokens.anna, product.id, {
        ...NEW_TEMPLATE,
        title: 'Second',
      })
    ).body.template.id

    expect(
      (await post(tokens.ivan, product.id, `${first}/archive`)).status
    ).toBe(403)
    expect(
      (await post(tokens.anna, product.id, `${first}/archive`)).status
    ).toBe(200)
    expect(
      (await post(tokens.admin, product.id, `${second}/archive`)).status
    ).toBe(200)
    expect(
      (await post(tokens.anna, product.id, `${first}/archive`)).status
    ).toBe(409)
  })

  it('відновити може власник і адмін; відновлений шаблон знову в списку', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id
    await post(tokens.anna, product.id, `${id}/archive`).expect(200)

    expect((await post(tokens.ivan, product.id, `${id}/restore`)).status).toBe(
      404
    )
    expect((await post(tokens.anna, product.id, `${id}/restore`)).status).toBe(
      200
    )
    expect((await post(tokens.anna, product.id, `${id}/restore`)).status).toBe(
      409
    )
    expect((await list(tokens.ivan, product.id)).body.templates).toHaveLength(1)
  })

  it('архівний шаблон не правиться й не дублюється', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id
    await post(tokens.anna, product.id, `${id}/archive`).expect(200)

    expect(
      (
        await patch(tokens.anna, product.id, id, {
          expectedVersion: 1,
          body: 'x',
        })
      ).status
    ).toBe(409)
    expect(
      (await post(tokens.anna, product.id, `${id}/duplicate`)).status
    ).toBe(409)
  })
})

describe('версії', () => {
  it('кожна зміна змісту збільшує версію, без змін версія та сама', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id

    const changed = await patch(tokens.anna, product.id, id, {
      expectedVersion: 1,
      body: 'New text',
    })
    expect(changed.body.template.version).toBe(2)

    const same = await patch(tokens.anna, product.id, id, {
      expectedVersion: 2,
      body: 'New text',
      title: 'Intro email',
    })
    expect(same.status).toBe(200)
    expect(same.body.template.version).toBe(2)

    const title = await patch(tokens.anna, product.id, id, {
      expectedVersion: 2,
      title: 'Renamed',
    })
    expect(title.body.template.version).toBe(3)
  })

  it('застаріла версія: 409 і актуальний шаблон у відповіді, дані не затираються', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id
    await patch(tokens.anna, product.id, id, {
      expectedVersion: 1,
      body: 'Tab A',
    }).expect(200)

    const stale = await patch(tokens.anna, product.id, id, {
      expectedVersion: 1,
      body: 'Tab B',
    })

    expect(stale.status).toBe(409)
    expect(stale.body.code).toBe('STALE_VERSION')
    expect(stale.body.template.body).toBe('Tab A')
    expect(
      (await prisma.outreachTemplate.findUniqueOrThrow({ where: { id } })).body
    ).toBe('Tab A')
  })

  it('гонка: дві одночасні правки з однією версією, виграє одна', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id

    const results = await Promise.all(
      ['A', 'B', 'C'].map((text) =>
        patch(tokens.anna, product.id, id, {
          expectedVersion: 1,
          body: `Text ${text}`,
        })
      )
    )

    expect(
      results.filter((r) => r.status === 200 && r.body.template.version === 2)
    ).toHaveLength(1)
    expect(results.filter((r) => r.status === 409)).toHaveLength(2)
    expect(
      (await prisma.outreachTemplate.findUniqueOrThrow({ where: { id } }))
        .version
    ).toBe(2)
  })

  it('зміна каналу на нелистовий очищує тему; невідома змінна при правці відхиляється', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id

    expect(
      (
        await patch(tokens.anna, product.id, id, {
          expectedVersion: 1,
          body: '{{oops}}',
        })
      ).status
    ).toBe(400)

    const res = await patch(tokens.anna, product.id, id, {
      expectedVersion: 1,
      channel: 'telegram',
    })
    expect(res.body.template.channel).toBe('telegram')
    expect(res.body.template.subject).toBeNull()
  })
})

describe('видалення адміном', () => {
  it('адмін видаляє невикористаний шаблон, це пишеться в аудит', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id

    const res = await api()
      .delete(`/api/outreach/templates/${id}`)
      .set(inProduct(tokens.admin, product.id))

    expect(res.status).toBe(200)
    expect(await prisma.outreachTemplate.count()).toBe(0)
    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { action: 'template_deleted' },
    })
    expect(audit.meta).toEqual({ title: 'Intro email' })
  })

  it('модератор (навіть власник) видалити остаточно не може', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id

    const res = await api()
      .delete(`/api/outreach/templates/${id}`)
      .set(inProduct(tokens.anna, product.id))

    expect(res.status).toBe(403)
    expect(await prisma.outreachTemplate.count()).toBe(1)
  })

  it('використаний у журналі шаблон не видаляється, лише архівується', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id
    await api()
      .post('/api/outreach/targets')
      .set(inProduct(tokens.anna, product.id))
      .send({ value: '@durov', templateId: id })
      .expect(201)

    const res = await api()
      .delete(`/api/outreach/templates/${id}`)
      .set(inProduct(tokens.admin, product.id))

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('TEMPLATE_IN_USE')
    expect(await prisma.outreachTemplate.count()).toBe(1)
    expect((await post(tokens.admin, product.id, `${id}/archive`)).status).toBe(
      200
    )
  })

  it('неіснуючий шаблон 404', async () => {
    const { product, tokens } = await setup()

    expect(
      (
        await api()
          .delete('/api/outreach/templates/missing')
          .set(inProduct(tokens.admin, product.id))
      ).status
    ).toBe(404)
  })
})

describe('шаблон у подіях журналу', () => {
  const register = (
    token: string,
    productId: string,
    body: Record<string, unknown>
  ) =>
    api()
      .post('/api/outreach/targets')
      .set(inProduct(token, productId))
      .send(body)

  it('реєстрація запам’ятовує шаблон і його версію; історія показує назву й версію', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id

    const res = await register(tokens.anna, product.id, {
      value: '@durov',
      templateId: id,
    })

    expect(res.status).toBe(201)
    expect(res.body.target.events[0].template).toEqual({
      id,
      title: 'Intro email',
      version: 1,
    })
  })

  it('після правки шаблону старі події лишаються на старій версії, нові беруть актуальну', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id
    const target = (
      await register(tokens.anna, product.id, {
        value: '@durov',
        templateId: id,
      })
    ).body.target.id
    await patch(tokens.anna, product.id, id, {
      expectedVersion: 1,
      body: 'Second revision',
    }).expect(200)

    const res = await api()
      .post(`/api/outreach/targets/${target}/events`)
      .set(inProduct(tokens.anna, product.id))
      .send({ type: 'repeat', templateId: id })

    const versions = res.body.target.events.map(
      (e: { type: string; template: { version: number } | null }) => [
        e.type,
        e.template?.version,
      ]
    )
    expect(versions).toEqual([
      ['repeat', 2],
      ['first', 1],
    ])
  })

  it('чужий активний шаблон використати можна (копіювання доступне всім у продукті)', async () => {
    const { product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id

    const res = await register(tokens.ivan, product.id, {
      value: '@ivans_target',
      templateId: id,
    })

    expect(res.status).toBe(201)
    expect(res.body.target.events[0].template.version).toBe(1)
  })

  it('архівний 409, невідомий 404, шаблон іншого продукту 404; ціль при цьому не створюється', async () => {
    const { product, other, tokens } = await setup()
    const archived = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id
    await post(tokens.anna, product.id, `${archived}/archive`).expect(200)
    const foreign = (await create(tokens.anna, other.id, NEW_TEMPLATE)).body
      .template.id

    expect(
      (
        await register(tokens.anna, product.id, {
          value: '@durov',
          templateId: archived,
        })
      ).status
    ).toBe(409)
    expect(
      (
        await register(tokens.anna, product.id, {
          value: '@durov',
          templateId: 'missing',
        })
      ).status
    ).toBe(404)
    expect(
      (
        await register(tokens.anna, product.id, {
          value: '@durov',
          templateId: foreign,
        })
      ).status
    ).toBe(404)
    expect(await prisma.outreachTarget.count()).toBe(0)
  })

  it('БД не пускає подію з шаблоном без версії', async () => {
    const { anna, product, tokens } = await setup()
    const id = (await create(tokens.anna, product.id, NEW_TEMPLATE)).body
      .template.id
    const target = (
      await register(tokens.anna, product.id, { value: '@durov' })
    ).body.target.id

    await expect(
      prisma.outreachEvent.create({
        data: {
          productId: product.id,
          userId: anna.id,
          targetId: target,
          type: 'repeat',
          templateId: id,
        },
      })
    ).rejects.toThrow()
  })

  it('логін і refresh повертають імʼя користувача', async () => {
    await setup()

    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'anna@test.io', password: 'password-123' })

    expect(res.body.user.name).toBe('anna')
  })
})
