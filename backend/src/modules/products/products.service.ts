import { randomUUID } from 'node:crypto'
import { Prisma } from '../../generated/prisma/client.js'
import { Pagination } from '../../shared/types/types.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { TokenPayload } from '../auth/auth.types.js'
import {
  stripeCatalog,
  toStripeAmount,
} from '../billing/stripe-catalog.service.js'
import { productsRepo } from './products.repo.js'
import { toAdminDto, toCatalogDto, toPublicDto } from './products.mapper.js'
import type {
  AdminListDto,
  CatalogQueryDto,
  CreateProductDto,
  FindProductsDto,
  UpdateProductDto,
} from './products.schema.js'
import type { Product } from './products.types.js'

const isUniqueViolation = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'

const slugTaken = () =>
  ApiError(409, 'SLUG_TAKEN', 'A product with this slug already exists')

// Компенсація не повинна ховати первинну помилку: збій відкату лише логуємо.
const bestEffort = async (label: string, action: () => Promise<unknown>) => {
  try {
    await action()
  } catch (err) {
    console.error(`Stripe cleanup failed (${label}):`, err instanceof Error ? err.message : err)
  }
}

const requireProduct = async (id: string): Promise<Product> => {
  const product = (await productsRepo.findById(id)) as Product | null

  if (!product) {
    throw ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
  }

  return product
}

const isLinked = (product: Product): boolean =>
  product.stripeProductId !== null && product.stripePriceId !== null

const pricingOf = (product: Product) => ({
  price: product.price,
  currency: product.currency,
  billingPeriod: product.billingPeriod,
})

export const productsService = {
  toggleSavedProduct: async (user: TokenPayload, productId: string) => {
    const savedProduct = await productsRepo.findSavedProductByUserAndProduct(
      user.id,
      productId
    )

    if (savedProduct) {
      const product = await productsRepo.deleteSavedProduct(savedProduct.id)
      return { response: { unsaved: product } }
    } else {
      const product = await productsRepo.savedProduct(user.id, productId)
      return { response: { saved: product } }
    }
  },

  findProduct: async (slug: string, user?: TokenPayload, lang: 'en' | 'es' | 'uk' = 'en') => {
    const product = (await productsRepo.findProductBySlug(slug, user?.id)) as
      | (Product & { savedBy?: unknown[] })
      | null

    if (!product) {
      throw ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
    }

    const isSaved = user ? (product.savedBy?.length ?? 0) > 0 : false

    return { response: { product: toPublicDto(product, isSaved, lang) } }
  },
  // Картки для блоків сайту: продукти й агенти це один список, kind лише фільтр.
  listCatalog: async (query: CatalogQueryDto) => {
    const products = (await productsRepo.listCatalog(query.kind)) as Product[]

    return { response: { products: products.map((product) => toCatalogDto(product, query.lang)) } }
  },
  findProducts: async (data: FindProductsDto, user?: TokenPayload) => {
    const products = (await productsRepo.findProducts(
      data.name,
      data.kind,
      data.lastId,
      data.lastCreatedAt,
      user?.id
    )) as Array<Product & { savedBy?: unknown[] }>

    const publicProducts = products.map((product) =>
      toPublicDto(product, user ? (product.savedBy?.length ?? 0) > 0 : false)
    )

    const lastProduct = products.at(-1)

    return {
      response: {
        products: publicProducts,
        lastId: lastProduct?.id,
        lastCreatedAt: lastProduct?.createdAt,
      },
    }
  },

  findSavedProducts: async (user: TokenPayload, pag: Pagination) => {
    const products = await productsRepo.findSavedProductsByUser(user.id, pag)

    const productsWithIsSaved = products.map((saved) => ({
      ...saved,
      product: { ...saved.product, isSaved: true },
    }))

    const lastId = products.at(-1)?.id
    const lastCreatedAt = products.at(-1)?.createdAt

    return {
      response: { products: productsWithIsSaved, lastId, lastCreatedAt },
    }
  },
  //admin
  listForAdmin: async (query: AdminListDto) => {
    const products = (await productsRepo.listAdmin({
      q: query.q,
      kind: query.kind,
      state: query.state,
    })) as Product[]

    return { response: { products: products.map(toAdminDto) } }
  },
  // Спочатку Stripe, потім БД: якщо Stripe не відповів, у БД не лишається продукт без привʼязки;
  // якщо не вдався запис у БД, створені у Stripe обʼєкти деактивуються.
  createProduct: async (data: CreateProductDto) => {
    if (await productsRepo.findBySlugAny(data.slug)) throw slugTaken()

    const id = randomUUID()
    const stripe = await stripeCatalog.createProductWithPrice(
      { id, slug: data.slug, name: data.name, description: data.description },
      data
    )

    try {
      const product = (await productsRepo.createProduct(id, data, stripe)) as Product
      return { response: { product: toAdminDto(product) } }
    } catch (err) {
      await bestEffort('deactivate price', () => stripeCatalog.deactivatePrice(stripe.stripePriceId))
      await bestEffort('deactivate product', () =>
        stripeCatalog.setProductActive(stripe.stripeProductId, false)
      )

      if (isUniqueViolation(err)) throw slugTaken()
      throw err
    }
  },
  updateProduct: async (id: string, data: UpdateProductDto) => {
    const product = await requireProduct(id)

    if (product.archivedAt) {
      throw ApiError(409, 'PRODUCT_ARCHIVED', 'Restore the product before editing it')
    }

    if (!isLinked(product)) {
      throw ApiError(
        409,
        'STRIPE_NOT_LINKED',
        'This product is not linked to Stripe yet. Use "Sync with Stripe" first.'
      )
    }

    if (data.slug !== undefined && data.slug !== product.slug) {
      if (await productsRepo.findBySlugAny(data.slug)) throw slugTaken()
    }

    const stripeProductId = product.stripeProductId!
    const stripePriceId = product.stripePriceId!

    const nextPricing = {
      price: data.price ?? product.price,
      currency: data.currency ?? product.currency,
      billingPeriod: data.billingPeriod ?? product.billingPeriod,
    }
    // Ціна у Stripe незмінна: нова сума, валюта чи період означають нову ціну.
    const isPricingChanged =
      toStripeAmount(nextPricing.price, nextPricing.currency) !==
        toStripeAmount(product.price, product.currency) ||
      nextPricing.currency !== product.currency ||
      nextPricing.billingPeriod !== product.billingPeriod

    const info = {
      name: data.name !== undefined && data.name !== product.name ? data.name : undefined,
      description:
        data.description !== undefined && data.description !== product.description
          ? data.description
          : undefined,
      slug: data.slug !== undefined && data.slug !== product.slug ? data.slug : undefined,
    }
    const isInfoChanged = Object.values(info).some((value) => value !== undefined)

    if (isInfoChanged) {
      await stripeCatalog.updateProductInfo(stripeProductId, info)
    }

    const revertInfo = () =>
      bestEffort('revert product info', () =>
        stripeCatalog.updateProductInfo(stripeProductId, {
          name: product.name,
          description: product.description,
          slug: product.slug,
        })
      )

    let newPriceId: string | undefined

    if (isPricingChanged) {
      try {
        newPriceId = await stripeCatalog.createPrice(stripeProductId, nextPricing)
      } catch (err) {
        if (isInfoChanged) await revertInfo()
        throw err
      }
    }

    let updated: Product

    try {
      updated = (await productsRepo.updateProduct(id, data, newPriceId)) as Product
    } catch (err) {
      if (newPriceId) {
        await bestEffort('deactivate new price', () => stripeCatalog.deactivatePrice(newPriceId!))
      }
      if (isInfoChanged) await revertInfo()

      if (isUniqueViolation(err)) throw slugTaken()
      throw err
    }

    // Стара ціна вимикається лише після успішного запису; чинні підписки на неї не зачіпаються.
    if (newPriceId) {
      await bestEffort('deactivate old price', () => stripeCatalog.deactivatePrice(stripePriceId))
    }

    return { response: { product: toAdminDto(updated) } }
  },
  // Видалення це архівування: продукт зникає з сайту й оплати, а журнал, історія та Stripe-привʼязка лишаються.
  archiveProduct: async (id: string) => {
    const product = await requireProduct(id)

    if (product.archivedAt) {
      throw ApiError(409, 'ALREADY_ARCHIVED', 'Product is already archived')
    }

    if (product.stripeProductId) {
      await stripeCatalog.setProductActive(product.stripeProductId, false)
    }

    try {
      const archived = (await productsRepo.setArchivedAt(id, new Date())) as Product
      return { response: { product: toAdminDto(archived) } }
    } catch (err) {
      if (product.stripeProductId) {
        await bestEffort('reactivate product', () =>
          stripeCatalog.setProductActive(product.stripeProductId!, true)
        )
      }
      throw err
    }
  },
  restoreProduct: async (id: string) => {
    const product = await requireProduct(id)

    if (!product.archivedAt) {
      throw ApiError(409, 'NOT_ARCHIVED', 'Product is not archived')
    }

    if (product.stripeProductId) {
      await stripeCatalog.setProductActive(product.stripeProductId, true)
    }

    try {
      const restored = (await productsRepo.setArchivedAt(id, null)) as Product
      return { response: { product: toAdminDto(restored) } }
    } catch (err) {
      if (product.stripeProductId) {
        await bestEffort('deactivate product', () =>
          stripeCatalog.setProductActive(product.stripeProductId!, false)
        )
      }
      throw err
    }
  },
  // Привʼязує продукт до Stripe або лагодить розбіжності (немає Stripe-продукту, ціни чи вони не збігаються).
  syncWithStripe: async (id: string) => {
    const product = await requireProduct(id)

    if (product.archivedAt) {
      throw ApiError(409, 'PRODUCT_ARCHIVED', 'Restore the product before syncing it')
    }

    const repaired: string[] = []
    let current = product

    const linkFromScratch = async () => {
      const stripe = await stripeCatalog.createProductWithPrice(
        { id: product.id, slug: product.slug, name: product.name, description: product.description },
        pricingOf(product)
      )

      try {
        current = (await productsRepo.setStripeIds(id, stripe)) as Product
      } catch (err) {
        await bestEffort('deactivate price', () => stripeCatalog.deactivatePrice(stripe.stripePriceId))
        await bestEffort('deactivate product', () =>
          stripeCatalog.setProductActive(stripe.stripeProductId, false)
        )
        throw err
      }

      repaired.push('product', 'price')
    }

    const remoteProduct = product.stripeProductId
      ? await stripeCatalog.retrieveProduct(product.stripeProductId)
      : null

    if (!remoteProduct) {
      // Привʼязки немає, або Stripe-продукт зник: створюємо наново й записуємо нові id.
      await linkFromScratch()
    } else {
      const stripeProductId = remoteProduct.id

      if (
        !remoteProduct.active ||
        remoteProduct.name !== product.name ||
        (remoteProduct.description ?? '') !== product.description
      ) {
        await stripeCatalog.updateProductInfo(stripeProductId, {
          name: product.name,
          description: product.description,
          slug: product.slug,
        })
        if (!remoteProduct.active) {
          await stripeCatalog.setProductActive(stripeProductId, true)
        }
        repaired.push('product-info')
      }

      const remotePrice = product.stripePriceId
        ? await stripeCatalog.retrievePrice(product.stripePriceId)
        : null

      const expectedAmount = toStripeAmount(product.price, product.currency)
      const isPriceValid =
        remotePrice !== null &&
        remotePrice.active &&
        remotePrice.unit_amount === expectedAmount &&
        remotePrice.currency === product.currency.toLowerCase() &&
        remotePrice.recurring?.interval === product.billingPeriod

      if (!isPriceValid) {
        const newPriceId = await stripeCatalog.createPrice(stripeProductId, pricingOf(product))

        try {
          current = (await productsRepo.setStripeIds(id, {
            stripeProductId,
            stripePriceId: newPriceId,
          })) as Product
        } catch (err) {
          await bestEffort('deactivate new price', () => stripeCatalog.deactivatePrice(newPriceId))
          throw err
        }

        if (remotePrice?.active && product.stripePriceId) {
          await bestEffort('deactivate old price', () =>
            stripeCatalog.deactivatePrice(product.stripePriceId!)
          )
        }
        repaired.push('price')
      }
    }

    return { response: { product: toAdminDto(current), repaired } }
  },
}
