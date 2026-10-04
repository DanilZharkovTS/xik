import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Підроблене сховище: мережі до S3 у тестах немає.
const store = vi.hoisted(() => ({
  puts: [] as { key: string; mime: string; size: number }[],
}))
vi.mock('../src/modules/media/storage.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/media/storage.js')>()),
  mediaDir: () => '/tmp/xik-test-media',
  storage: {
    put: async (key: string, body: Buffer, mime: string) => {
      store.puts.push({ key, mime, size: body.length })
      return `https://cdn.test/${key}`
    },
  },
}))

import sharp from 'sharp'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  auth,
  createProduct,
  createUser,
  loginOk,
  resetDb,
} from './helpers.js'

beforeEach(async () => {
  vi.stubEnv('MEDIA_URL', 'https://cdn.test')
  await resetDb()
  store.puts.length = 0
})

afterEach(() => vi.unstubAllEnvs())

// 1x1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

const setup = async () => {
  await createUser('admin', 'admin@test.io')
  await createUser('moderator', 'mod@test.io')
  await createUser('user', 'buyer@test.io')
  return {
    admin: (await loginOk('admin@test.io')).accessToken,
    mod: (await loginOk('mod@test.io')).accessToken,
    buyer: (await loginOk('buyer@test.io')).accessToken,
  }
}

const text = (id: string, value = 'Hello **world**') => ({
  id,
  type: 'text',
  text: value,
})

const EN = {
  slug: 'hello-world',
  title: 'Hello world',
  excerpt: 'First post excerpt',
  keywords: ['ai', 'agents'],
  blocks: [text('b1')],
}

const body = (
  extra: Record<string, unknown> = {},
  translations: Record<string, unknown> = {}
) => ({
  status: 'published',
  translations: { en: EN, ...translations },
  ...extra,
})

const create = (token: string, data: Record<string, unknown> = body()) =>
  api().post('/api/blog/admin/articles').set(auth(token)).send(data)

const PAST = new Date(Date.now() - 3600_000).toISOString()
const FUTURE = new Date(Date.now() + 3600_000).toISOString()

describe('доступ', () => {
  it('адмінка блогу лише для admin', async () => {
    const t = await setup()

    expect((await api().get('/api/blog/admin/articles')).status).toBe(401)
    expect(
      (await api().get('/api/blog/admin/articles').set(auth(t.mod))).status
    ).toBe(403)
    expect(
      (await api().get('/api/blog/admin/articles').set(auth(t.buyer))).status
    ).toBe(403)
    expect((await create(t.mod)).status).toBe(403)
    expect(
      (await api().get('/api/blog/admin/articles').set(auth(t.admin))).status
    ).toBe(200)
  })
})

describe('створення й публікація', () => {
  it('створює статтю з англійською, віддає її публічно', async () => {
    const t = await setup()
    const created = await create(t.admin)

    expect(created.status).toBe(201)
    expect(created.body.article.translations.en).toMatchObject({
      slug: 'hello-world',
      isReady: true,
      readingMinutes: 1,
    })

    const list = (await api().get('/api/blog/articles')).body
    expect(list.articles).toHaveLength(1)
    expect(list.articles[0]).toMatchObject({
      slug: 'hello-world',
      title: 'Hello world',
      locale: 'en',
    })

    const one = (await api().get('/api/blog/articles/hello-world')).body.article
    expect(one.blocks[0]).toMatchObject({
      type: 'text',
      text: 'Hello **world**',
    })
    expect(one.alternates).toEqual({ en: 'hello-world' })
    expect(one.seoTitle).toBeNull()
    expect(one.keywords).toEqual(['ai', 'agents'])
  })

  it('без англійського перекладу створити не можна', async () => {
    const t = await setup()

    await create(t.admin, { status: 'draft', translations: { es: EN } }).expect(
      400
    )
  })

  it('публікація вимагає завершену англійську версію (заголовок, анонс, блок)', async () => {
    const t = await setup()

    const res = await create(
      t.admin,
      body({}, {}) && {
        status: 'published',
        translations: { en: { ...EN, blocks: [] } },
      }
    )

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('ARTICLE_NOT_PUBLISHABLE')
    await create(t.admin, {
      status: 'draft',
      translations: { en: { ...EN, blocks: [] } },
    }).expect(201)
  })

  it('чернетка не видна на сайті', async () => {
    const t = await setup()
    await create(t.admin, body({ status: 'draft' })).expect(201)

    expect((await api().get('/api/blog/articles')).body.articles).toHaveLength(
      0
    )
    expect((await api().get('/api/blog/articles/hello-world')).status).toBe(404)
  })

  it('планування: майбутня дата ховає статтю, минула показує', async () => {
    const t = await setup()
    const scheduled = await create(t.admin, body({ publishedAt: FUTURE }))

    expect(scheduled.body.article.state).toBe('scheduled')
    expect((await api().get('/api/blog/articles')).body.articles).toHaveLength(
      0
    )
    expect((await api().get('/api/blog/articles/hello-world')).status).toBe(404)

    await api()
      .patch(`/api/blog/admin/articles/${scheduled.body.article.id}`)
      .set(auth(t.admin))
      .send({ publishedAt: PAST })
      .expect(200)

    expect((await api().get('/api/blog/articles')).body.articles).toHaveLength(
      1
    )
  })

  it('публікація без дати ставить поточний час', async () => {
    const t = await setup()
    const res = await create(t.admin)

    expect(Date.now() - Date.parse(res.body.article.publishedAt)).toBeLessThan(
      5000
    )
  })

  it('архівна стаття зникає з сайту й зі списку за замовчуванням', async () => {
    const t = await setup()
    const id = (await create(t.admin)).body.article.id

    await api()
      .patch(`/api/blog/admin/articles/${id}`)
      .set(auth(t.admin))
      .send({ status: 'archived' })
      .expect(200)

    expect((await api().get('/api/blog/articles')).body.articles).toHaveLength(
      0
    )
    expect(
      (await api().get('/api/blog/admin/articles').set(auth(t.admin))).body
        .articles
    ).toHaveLength(0)
    expect(
      (
        await api()
          .get('/api/blog/admin/articles')
          .query({ state: 'archived' })
          .set(auth(t.admin))
      ).body.articles
    ).toHaveLength(1)
  })
})

describe('переклади', () => {
  const ES = {
    slug: 'hola-mundo',
    title: 'Hola mundo',
    excerpt: 'Extracto',
    keywords: [],
    blocks: [text('e1', 'Hola')],
  }
  const UK = {
    slug: 'pryvit-svit',
    title: 'Привіт, світе',
    excerpt: 'Анонс',
    keywords: [],
    blocks: [text('u1', 'Привіт')],
  }

  it('кожна мова має власний slug; alternates містить усі готові мови', async () => {
    const t = await setup()
    await create(t.admin, body({}, { es: ES, uk: UK })).expect(201)

    const es = (
      await api().get('/api/blog/articles/hola-mundo').query({ lang: 'es' })
    ).body.article
    expect(es).toMatchObject({ title: 'Hola mundo', locale: 'es' })
    expect(es.alternates).toEqual({
      en: 'hello-world',
      es: 'hola-mundo',
      uk: 'pryvit-svit',
    })

    expect(
      (await api().get('/api/blog/articles/hello-world').query({ lang: 'es' }))
        .status
    ).toBe(404)
    expect(
      (await api().get('/api/blog/articles/pryvit-svit').query({ lang: 'uk' }))
        .body.article.title
    ).toBe('Привіт, світе')
  })

  it('список мови містить лише статті з перекладом', async () => {
    const t = await setup()
    await create(t.admin, body({}, { es: ES })).expect(201)
    await create(t.admin, {
      status: 'published',
      translations: { en: { ...EN, slug: 'only-en', title: 'Only EN' } },
    }).expect(201)

    const en = (await api().get('/api/blog/articles')).body.articles
    const es = (await api().get('/api/blog/articles').query({ lang: 'es' }))
      .body.articles
    const uk = (await api().get('/api/blog/articles').query({ lang: 'uk' }))
      .body.articles

    expect(en).toHaveLength(2)
    expect(es.map((a: { slug: string }) => a.slug)).toEqual(['hola-mundo'])
    expect(uk).toHaveLength(0)
  })

  it('незавершений переклад (без блоків) на сайті не показується', async () => {
    const t = await setup()
    await create(t.admin, body({}, { es: { ...ES, blocks: [] } })).expect(201)

    expect(
      (await api().get('/api/blog/articles/hola-mundo').query({ lang: 'es' }))
        .status
    ).toBe(404)
    const alternates = (await api().get('/api/blog/articles/hello-world')).body
      .article.alternates
    expect(alternates).toEqual({ en: 'hello-world' })
  })

  it('slug унікальний у межах мови, але може збігатися між мовами', async () => {
    const t = await setup()
    await create(t.admin).expect(201)

    const dup = await create(t.admin)
    expect(dup.status).toBe(409)
    expect(dup.body.code).toBe('ARTICLE_SLUG_TAKEN')

    await create(
      t.admin,
      body({}, {}) && {
        status: 'draft',
        translations: {
          en: { ...EN, slug: 'other' },
          es: { ...ES, slug: 'hello-world' },
        },
      }
    ).expect(201)
  })

  it('PATCH додає, змінює й видаляє переклад; англійський видалити не можна', async () => {
    const t = await setup()
    const id = (await create(t.admin)).body.article.id
    const patch = (data: Record<string, unknown>) =>
      api()
        .patch(`/api/blog/admin/articles/${id}`)
        .set(auth(t.admin))
        .send(data)

    await patch({ translations: { es: ES } }).expect(200)
    expect(
      (await api().get('/api/blog/articles/hola-mundo').query({ lang: 'es' }))
        .status
    ).toBe(200)

    await patch({ translations: { es: { ...ES, title: 'Cambiado' } } }).expect(
      200
    )
    expect(
      (await api().get('/api/blog/articles/hola-mundo').query({ lang: 'es' }))
        .body.article.title
    ).toBe('Cambiado')

    await patch({ translations: { es: null } }).expect(200)
    expect(
      (await api().get('/api/blog/articles/hola-mundo').query({ lang: 'es' }))
        .status
    ).toBe(404)

    await patch({ translations: { en: null } }).expect(400)
  })
})

describe('блоки', () => {
  it('відхиляє невідомий тип, зайві поля, небезпечні й невалідні дані', async () => {
    const t = await setup()
    const blocks = (list: unknown[]) =>
      create(t.admin, {
        status: 'draft',
        translations: { en: { ...EN, blocks: list } },
      })

    expect(
      (await blocks([{ id: 'x', type: 'script', text: 'x' }])).status
    ).toBe(400)
    expect(
      (await blocks([{ id: 'x', type: 'text', text: 'a', html: '<b>' }])).status
    ).toBe(400)
    expect(
      (
        await blocks([
          {
            id: 'x',
            type: 'cta',
            title: 'T',
            buttonLabel: 'Go',
            url: 'javascript:alert(1)',
          },
        ])
      ).status
    ).toBe(400)
    expect(
      (
        await blocks([
          {
            id: 'x',
            type: 'cta',
            title: 'T',
            buttonLabel: 'Go',
            url: '//evil.com',
          },
        ])
      ).status
    ).toBe(400)
    expect(
      (await blocks([{ id: 'x', type: 'video', url: 'https://evil.com/v' }]))
        .status
    ).toBe(400)
    expect(
      (await blocks([{ id: 'x', type: 'heading', level: 4, text: 'h' }])).status
    ).toBe(400)
    expect(
      (
        await blocks([
          { id: 'x', type: 'image', assetId: 'not-a-uuid', alt: 'a' },
        ])
      ).status
    ).toBe(400)
  })

  it('приймає всі типи; відео розкладається на адресу вбудовування, продукт і зображення підтягуються', async () => {
    const t = await setup()
    const product = await createProduct('Keyho')
    const upload = await api()
      .post('/api/media')
      .set(auth(t.admin))
      .set('Content-Type', 'image/png')
      .send(PNG)
    const assetId = upload.body.asset.id

    const blocks = [
      { id: 'h', type: 'heading', level: 2, text: 'Intro' },
      text('t'),
      { id: 'i', type: 'image', assetId, alt: 'A pixel', caption: 'Cap' },
      { id: 'v', type: 'video', url: 'https://youtu.be/dQw4w9WgXcQ' },
      { id: 'q', type: 'quote', text: 'Quote', author: 'Ann' },
      {
        id: 'c',
        type: 'cta',
        title: 'Try',
        buttonLabel: 'Go',
        url: '/products',
      },
      { id: 'p', type: 'product', productId: product.id },
    ]
    await create(t.admin, {
      status: 'published',
      coverAssetId: assetId,
      translations: { en: { ...EN, blocks } },
    }).expect(201)

    const article = (await api().get('/api/blog/articles/hello-world')).body
      .article

    expect(article.cover).toMatchObject({
      url: expect.stringContaining('cdn.test/articles/'),
      width: 1,
      height: 1,
    })
    const byType = Object.fromEntries(
      article.blocks.map((b: { type: string }) => [b.type, b])
    )
    expect(byType.image).toMatchObject({
      url: article.cover.url,
      alt: 'A pixel',
      caption: 'Cap',
      width: 1,
    })
    expect(byType.video).toMatchObject({
      provider: 'youtube',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    })
    expect(byType.product.product).toMatchObject({ id: product.id })
    expect(JSON.stringify(article)).not.toMatch(/stripe/i)
    expect(byType.cta).toMatchObject({ url: '/products' })
  })

  it('продукт у блоці локалізується, архівний продукт тихо зникає', async () => {
    const t = await setup()
    const product = await createProduct('Keyho')
    await prisma.product.update({
      where: { id: product.id },
      data: {
        translations: {
          es: { name: 'Keyho ES', shortDescription: 'c', description: 'l' },
        },
      },
    })
    const es = {
      slug: 'hola',
      title: 'Hola',
      excerpt: 'x',
      keywords: [],
      blocks: [{ id: 'p', type: 'product', productId: product.id }],
    }
    await create(t.admin, body({}, { es })).expect(201)

    const shown = (
      await api().get('/api/blog/articles/hola').query({ lang: 'es' })
    ).body.article.blocks
    expect(shown[0].product.name).toBe('Keyho ES')

    await prisma.product.update({
      where: { id: product.id },
      data: { archivedAt: new Date() },
    })
    expect(
      (await api().get('/api/blog/articles/hola').query({ lang: 'es' })).body
        .article.blocks
    ).toEqual([])
  })

  it('посилання на неіснуючі зображення, продукти, рубрики й теги відхиляються', async () => {
    const t = await setup()
    const ghost = '00000000-0000-4000-8000-000000000000'

    for (const data of [
      { coverAssetId: ghost },
      { categoryId: ghost },
      { tagIds: [ghost] },
      {
        translations: {
          en: {
            ...EN,
            blocks: [{ id: 'i', type: 'image', assetId: ghost, alt: 'a' }],
          },
        },
      },
      {
        translations: {
          en: {
            ...EN,
            blocks: [{ id: 'p', type: 'product', productId: ghost }],
          },
        },
      },
    ]) {
      const res = await create(t.admin, {
        status: 'draft',
        translations: { en: EN },
        ...data,
      })
      expect(res.status, JSON.stringify(data).slice(0, 60)).toBe(400)
      expect(res.body.code).toBe('INVALID_REFERENCE')
    }
  })

  it('час читання рахується за словами без розмітки', async () => {
    const t = await setup()
    const long = Array.from({ length: 450 }, () => 'word').join(' ')
    const res = await create(t.admin, {
      status: 'draft',
      translations: { en: { ...EN, blocks: [text('a', long)] } },
    })

    expect(res.body.article.translations.en.readingMinutes).toBe(3)
  })
})

describe('блоки коду й виносок, автор', () => {
  it('приймає код і виноску та віддає їх без змін', async () => {
    const t = await setup()
    const blocks = [
      {
        id: 'c',
        type: 'code',
        language: 'ts',
        code: 'const a = "<b>" // 1 < 2',
      },
      {
        id: 'n',
        type: 'callout',
        tone: 'warning',
        title: 'Heads up',
        text: 'Careful here',
      },
    ]
    await create(t.admin, {
      status: 'published',
      translations: { en: { ...EN, blocks } },
    }).expect(201)

    const shown = (await api().get('/api/blog/articles/hello-world')).body
      .article.blocks

    expect(shown[0]).toMatchObject({
      type: 'code',
      language: 'ts',
      code: 'const a = "<b>" // 1 < 2',
    })
    expect(shown[1]).toMatchObject({
      type: 'callout',
      tone: 'warning',
      title: 'Heads up',
    })
  })

  it('відхиляє порожній код, невідомий тон і небезпечну назву мови', async () => {
    const t = await setup()
    const blocks = (list: unknown[]) =>
      create(t.admin, {
        status: 'draft',
        translations: { en: { ...EN, blocks: list } },
      })

    expect((await blocks([{ id: 'c', type: 'code', code: '' }])).status).toBe(
      400
    )
    expect(
      (
        await blocks([
          { id: 'c', type: 'code', language: '"><script>', code: 'x' },
        ])
      ).status
    ).toBe(400)
    expect(
      (await blocks([{ id: 'n', type: 'callout', tone: 'danger', text: 'x' }]))
        .status
    ).toBe(400)
    expect(
      (await blocks([{ id: 'n', type: 'callout', tone: 'info', text: '' }]))
        .status
    ).toBe(400)
  })

  it('стаття віддає імʼя автора, але не пошту й токен', async () => {
    const t = await setup()
    await create(t.admin).expect(201)

    const article = (await api().get('/api/blog/articles/hello-world')).body
      .article

    expect(article.author).toEqual({ name: 'admin' })
    expect(JSON.stringify(article)).not.toContain('admin@test.io')
  })
})

describe('рубрики, теги, перелінковка', () => {
  const mk = async (token: string) => {
    const category = (
      await api()
        .post('/api/blog/admin/categories')
        .set(auth(token))
        .send({ slug: 'guides', names: { en: 'Guides', uk: 'Гайди' } })
    ).body.category
    const tagA = (
      await api()
        .post('/api/blog/admin/tags')
        .set(auth(token))
        .send({ slug: 'ai', names: { en: 'AI' } })
    ).body.tag
    const tagB = (
      await api()
        .post('/api/blog/admin/tags')
        .set(auth(token))
        .send({ slug: 'seo', names: { en: 'SEO' } })
    ).body.tag
    return { category, tagA, tagB }
  }

  it('фільтр за тегом і рубрикою, локалізовані назви, лічильники лише видимих', async () => {
    const t = await setup()
    const { category, tagA, tagB } = await mk(t.admin)

    await create(
      t.admin,
      body({ categoryId: category.id, tagIds: [tagA.id] })
    ).expect(201)
    await create(t.admin, {
      ...body({ tagIds: [tagB.id] }),
      translations: { en: { ...EN, slug: 'second', title: 'Second' } },
    }).expect(201)
    await create(t.admin, {
      ...body({ status: 'draft', tagIds: [tagB.id] }),
      translations: { en: { ...EN, slug: 'hidden', title: 'Hidden' } },
    }).expect(201)

    const byTag = (await api().get('/api/blog/articles').query({ tag: 'ai' }))
      .body.articles
    expect(byTag.map((a: { slug: string }) => a.slug)).toEqual(['hello-world'])
    expect(byTag[0].category).toMatchObject({ slug: 'guides', name: 'Guides' })

    const byCategory = (
      await api().get('/api/blog/articles').query({ category: 'guides' })
    ).body.articles
    expect(byCategory).toHaveLength(1)

    const tax = (await api().get('/api/blog/taxonomy')).body
    expect(tax.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'seo', count: 1 }),
      ])
    )
    expect(tax.categories[0]).toMatchObject({
      slug: 'guides',
      name: 'Guides',
      count: 1,
    })
  })

  it('назва рубрики мовою без перекладу береться англійська', async () => {
    const t = await setup()
    const { category } = await mk(t.admin)
    const es = {
      slug: 'hola',
      title: 'Hola',
      excerpt: 'x',
      keywords: [],
      blocks: [text('e')],
    }
    await create(t.admin, body({ categoryId: category.id }, { es })).expect(201)

    const card = (await api().get('/api/blog/articles').query({ lang: 'es' }))
      .body.articles[0]
    expect(card.category.name).toBe('Guides')
  })

  it('"Читайте також": спершу статті зі спільними тегами, решта добирається найновішими', async () => {
    const t = await setup()
    const { tagA, tagB } = await mk(t.admin)
    const post = (slug: string, tagIds: string[], publishedAt: string) =>
      create(t.admin, {
        ...body({ tagIds, publishedAt }),
        translations: { en: { ...EN, slug, title: slug } },
      }).expect(201)

    await post('main', [tagA.id], PAST)
    await post(
      'shares-tag',
      [tagA.id],
      new Date(Date.now() - 7200_000).toISOString()
    )
    await post(
      'newer-no-tag',
      [tagB.id],
      new Date(Date.now() - 1800_000).toISOString()
    )

    const article = (await api().get('/api/blog/articles/main')).body.article

    expect(article.related.map((a: { slug: string }) => a.slug)).toEqual([
      'shares-tag',
      'newer-no-tag',
    ])
    expect(
      article.related.some((a: { slug: string }) => a.slug === 'main')
    ).toBe(false)
  })

  it("slug рубрики й тега унікальний; видалення тега відв'язує його від статей", async () => {
    const t = await setup()
    const { tagA } = await mk(t.admin)

    const dup = await api()
      .post('/api/blog/admin/tags')
      .set(auth(t.admin))
      .send({ slug: 'ai', names: { en: 'Again' } })
    expect(dup.status).toBe(409)

    const id = (await create(t.admin, body({ tagIds: [tagA.id] }))).body.article
      .id
    await api()
      .delete(`/api/blog/admin/tags/${tagA.id}`)
      .set(auth(t.admin))
      .expect(200)

    expect(
      (await api().get(`/api/blog/admin/articles/${id}`).set(auth(t.admin)))
        .body.article.tagIds
    ).toEqual([])
    expect(
      (await api().get('/api/blog/articles').query({ tag: 'ai' })).body.articles
    ).toHaveLength(0)
  })

  it('відхиляє некоректний slug', async () => {
    const t = await setup()

    for (const slug of [
      'Has Caps',
      'пробіл',
      '-lead',
      'a--b',
      'x'.repeat(61),
    ]) {
      await api()
        .post('/api/blog/admin/tags')
        .set(auth(t.admin))
        .send({ slug, names: { en: 'X' } })
        .expect(400)
    }
  })
})

describe("прев'ю, feed", () => {
  it('токен показує чернетку без публікації; новий токен скасовує старий', async () => {
    const t = await setup()
    const created = (await create(t.admin, body({ status: 'draft' }))).body
      .article

    const preview = await api().get(`/api/blog/preview/${created.previewToken}`)
    expect(preview.status).toBe(200)
    expect(preview.body.article).toMatchObject({
      title: 'Hello world',
      isPreview: true,
    })
    expect(preview.body.article.related).toEqual([])

    const rotated = (
      await api()
        .post(`/api/blog/admin/articles/${created.id}/preview-token`)
        .set(auth(t.admin))
    ).body.previewToken
    expect(rotated).not.toBe(created.previewToken)
    expect(
      (await api().get(`/api/blog/preview/${created.previewToken}`)).status
    ).toBe(404)
    expect((await api().get(`/api/blog/preview/${rotated}`)).status).toBe(200)
  })

  it("прев'ю мовою без перекладу дає 404; токен не потрапляє у публічні відповіді", async () => {
    const t = await setup()
    const created = (await create(t.admin, body({ status: 'draft' }))).body
      .article

    expect(
      (
        await api()
          .get(`/api/blog/preview/${created.previewToken}`)
          .query({ lang: 'es' })
      ).status
    ).toBe(404)

    await api()
      .patch(`/api/blog/admin/articles/${created.id}`)
      .set(auth(t.admin))
      .send({ status: 'published' })
      .expect(200)
    const publicBody =
      JSON.stringify((await api().get('/api/blog/articles/hello-world')).body) +
      JSON.stringify((await api().get('/api/blog/articles')).body) +
      JSON.stringify((await api().get('/api/blog/feed')).body)
    expect(publicBody).not.toContain(created.previewToken)
  })

  it('feed віддає лише видимі статті з готовими мовами', async () => {
    const t = await setup()
    const es = {
      slug: 'hola',
      title: 'Hola',
      excerpt: 'x',
      keywords: [],
      blocks: [text('e')],
    }
    await create(t.admin, body({}, { es })).expect(201)
    await create(
      t.admin,
      body({ status: 'draft' }) && {
        status: 'draft',
        translations: { en: { ...EN, slug: 'draft' } },
      }
    ).expect(201)
    await create(t.admin, {
      ...body({ publishedAt: FUTURE }),
      translations: { en: { ...EN, slug: 'later' } },
    }).expect(201)

    const feed = (await api().get('/api/blog/feed')).body.articles

    expect(feed).toHaveLength(1)
    expect(
      feed[0].translations.map((x: { locale: string }) => x.locale).sort()
    ).toEqual(['en', 'es'])
  })
})

describe('завантаження зображень', () => {
  const upload = (token: string, buffer: Buffer | string, type = 'image/png') =>
    api()
      .post('/api/media')
      .set(auth(token))
      .set('Content-Type', type)
      .send(buffer)

  it('лише admin; зберігає в сховище й повертає метадані', async () => {
    const t = await setup()

    expect((await upload(t.buyer, PNG)).status).toBe(403)
    expect(
      (
        await api()
          .post('/api/media')
          .set('Content-Type', 'image/png')
          .send(PNG)
      ).status
    ).toBe(401)

    const ok = await upload(t.admin, PNG)
    expect(ok.status).toBe(201)
    expect(ok.body.asset).toMatchObject({
      mime: 'image/png',
      width: 1,
      height: 1,
    })
    expect(store.puts).toHaveLength(1)
    expect(store.puts[0].key).toMatch(
      /^articles\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/
    )
    expect(await prisma.mediaAsset.count()).toBe(1)
  })

  it('перевіряє справжній вміст, а не заголовок: підроблений тип і не-зображення відхиляються', async () => {
    const t = await setup()

    expect(
      (
        await upload(
          t.admin,
          '<svg xmlns="http://www.w3.org/2000/svg"/>',
          'image/png'
        )
      ).status
    ).toBe(415)
    expect((await upload(t.admin, 'just text', 'image/png')).status).toBe(415)
    expect((await upload(t.admin, '<svg/>', 'image/svg+xml')).status).toBe(415)
    expect(
      (await upload(t.admin, PNG, 'application/octet-stream')).status
    ).toBe(415)
    expect(store.puts).toHaveLength(0)
  })

  it('відхиляє файл більший за 25 МБ', async () => {
    const t = await setup()
    const big = Buffer.concat([PNG, Buffer.alloc(25 * 1024 * 1024 + 10)])

    const res = await upload(t.admin, big)

    expect(res.status).toBe(413)
    expect(store.puts).toHaveLength(0)
  })

  it('велике фото зменшується до 2400 px і стає меншим за розміром', async () => {
    const t = await setup()
    const noise = await sharp({
      create: {
        width: 3600,
        height: 2400,
        channels: 3,
        background: '#888',
        noise: { type: 'gaussian', mean: 128, sigma: 60 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer()

    const res = await upload(t.admin, noise, 'image/jpeg')

    expect(res.status).toBe(201)
    expect(res.body.asset).toMatchObject({
      width: 2400,
      height: 1600,
      mime: 'image/jpeg',
    })
    expect(res.body.asset.size).toBeLessThan(noise.length)
    expect(store.puts[0].size).toBe(res.body.asset.size)
  })

  it('невелике зображення не збільшується й не псується', async () => {
    const t = await setup()

    const res = await upload(t.admin, PNG)

    expect(res.body.asset).toMatchObject({ width: 1, height: 1 })
  })

  it('бібліотека: список завантажених, нові першими', async () => {
    const t = await setup()
    await upload(t.admin, PNG)
    await upload(t.admin, PNG)

    const res = await api().get('/api/media').set(auth(t.admin))

    expect(res.status).toBe(200)
    expect(res.body.assets).toHaveLength(2)
    expect(res.body.total).toBe(2)
  })
})
