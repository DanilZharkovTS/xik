import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../shared/database/prisma.js'
import { Pagination } from '../../shared/types/types.js'
import type { CreateProductDto, UpdateProductDto } from './products.schema.js'

type ProductKind = 'product' | 'agent'

// Prisma розрізняє JSON null і відсутнє значення: щоб прибрати поле, треба Prisma.JsonNull.
const nullableJson = (value: unknown) =>
  value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue)

const writableFields = (data: Partial<CreateProductDto>) => ({
  ...(data.slug !== undefined && { slug: data.slug }),
  ...(data.name !== undefined && { name: data.name }),
  ...(data.kind !== undefined && { kind: data.kind }),
  ...(data.status !== undefined && { status: data.status }),
  ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
  ...(data.description !== undefined && { description: data.description }),
  ...(data.categories !== undefined && { categories: data.categories }),
  ...(data.features !== undefined && { features: data.features }),
  ...(data.categoryLabel !== undefined && { categoryLabel: data.categoryLabel }),
  ...(data.tagline !== undefined && { tagline: data.tagline }),
  ...(data.highlights !== undefined && { highlights: data.highlights }),
  ...(data.capabilities !== undefined && {
    capabilities: data.capabilities as Prisma.InputJsonValue,
  }),
  ...(data.architecture !== undefined && {
    architecture: nullableJson(data.architecture),
  }),
  ...(data.protocols !== undefined && { protocols: data.protocols }),
  ...(data.demoUrl !== undefined && { demoUrl: data.demoUrl }),
  ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
  ...(data.price !== undefined && { price: data.price }),
  ...(data.currency !== undefined && { currency: data.currency }),
  ...(data.billingPeriod !== undefined && { billingPeriod: data.billingPeriod }),
  ...(data.showPrice !== undefined && { showPrice: data.showPrice }),
  ...(data.translations !== undefined && {
    translations: data.translations as Prisma.InputJsonValue,
  }),
})

export const productsRepo = {
  // id задається заздалегідь: він іде у metadata Stripe-продукту ще до запису в БД.
  createProduct: async (
    id: string,
    data: CreateProductDto,
    stripe: { stripeProductId: string; stripePriceId: string } | null
  ) => {
    const product = await prisma.product.create({
      data: {
        id,
        ...writableFields(data),
        slug: data.slug,
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        categories: data.categories,
        features: data.features,
        price: data.price,
        currency: data.currency,
        billingPeriod: data.billingPeriod,
        ...stripe,
      },
    })
    return product
  },
  updateProduct: async (
    id: string,
    data: UpdateProductDto,
    stripePriceId?: string
  ) => {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...writableFields(data),
        ...(stripePriceId !== undefined && { stripePriceId }),
      },
    })
    return product
  },
  setStripeIds: async (
    id: string,
    ids: { stripeProductId?: string | null; stripePriceId?: string | null }
  ) => {
    const product = await prisma.product.update({
      where: { id },
      data: ids,
    })
    return product
  },
  setArchivedAt: async (id: string, archivedAt: Date | null) => {
    const product = await prisma.product.update({
      where: { id },
      data: { archivedAt },
    })
    return product
  },
  findById: async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
    })
    return product
  },
  findBySlugAny: async (slug: string) => {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })
    return product
  },
  // Публічна сторінка: архівні продукти не існують для відвідувачів.
  findProductBySlug: async (slug: string, userId?: string) => {
    const product = await prisma.product.findFirst({
      where: { slug, archivedAt: null },
      include: {
        savedBy: userId ? { where: { userId } } : false,
      },
    })
    return product
  },
  listCatalog: async (kind?: ProductKind) => {
    const products = await prisma.product.findMany({
      where: { archivedAt: null, ...(kind ? { kind } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: 200,
    })
    return products
  },
  listAdmin: async (params: {
    q?: string
    kind?: ProductKind
    state: 'active' | 'archived'
  }) => {
    const products = await prisma.product.findMany({
      where: {
        archivedAt: params.state === 'archived' ? { not: null } : null,
        ...(params.kind ? { kind: params.kind } : {}),
        ...(params.q
          ? {
              OR: [
                { name: { contains: params.q, mode: 'insensitive' as const } },
                { slug: { contains: params.q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: 200,
    })
    return products
  },
  findProducts: async (
    name: string | undefined,
    kind: ProductKind | undefined,
    lastId: string | undefined,
    lastCreatedAt: Date | undefined,
    userId?: string
  ) => {
    const products = await prisma.product.findMany({
      where: {
        archivedAt: null,
        ...(kind ? { kind } : {}),
        name: name
          ? {
              contains: name,
              mode: 'insensitive',
            }
          : undefined,
      },

      ...(lastId && lastCreatedAt
        ? {
            cursor: {
              createdAt_id: {
                createdAt: lastCreatedAt,
                id: lastId,
              },
            },
            skip: 1,
          }
        : {}),

      take: 50,

      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],

      include: {
        savedBy: userId
          ? {
              where: {
                userId,
              },
              select: {
                id: true,
              },
            }
          : false,
      },
    })

    return products
  },
  savedProduct: async (userId: string, productId: string) => {
    const savedProduct = await prisma.savedProduct.create({
      data: {
        userId,
        productId,
      },
    })
    return savedProduct
  },
  findSavedProductsByUser: async (userId: string, pag: Pagination) => {
    const savedProducts = await prisma.savedProduct.findMany({
      where: {
        userId,
      },
      include: {
        product: true,
      },

      ...(pag.lastId && pag.lastCreatedAt
        ? {
            cursor: {
              createdAt_id: {
                createdAt: pag.lastCreatedAt,
                id: pag.lastId,
              },
            },
            skip: 1,
          }
        : {}),

      take: 50,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })

    return savedProducts
  },
  findSavedProductByUserAndProduct: async (
    userId: string,
    productId: string
  ) => {
    const savedProduct = await prisma.savedProduct.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    })
    return savedProduct
  },
  deleteSavedProduct: async (id: string) => {
    const savedProduct = await prisma.savedProduct.delete({
      where: {
        id,
      },
    })
    return savedProduct
  },
}
