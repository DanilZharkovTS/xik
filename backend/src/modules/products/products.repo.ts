import { prisma } from '../../shared/database/prisma.js'
import { Pagination } from '../../shared/types/types.js'
import { CreateProductDto, UpdateProductDto } from './products.schema.js'

export const productsRepo = {
  createProduct: async (data: CreateProductDto) => {
    const product = await prisma.product.create({
      data: {
        slug: data.slug,
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        categories: data.categories,
        features: data.features,
        price: data.price,
        currency: data.currency,
        billingPeriod: data.billingPeriod,
      },
    })
    return product
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
  findById: async (id: string) => {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    })
    return product
  },
  findProductBySlug: async (slug: string, userId?: string) => {
    const product = await prisma.product.findUnique({
      where: {
        slug,
      },
      include: {
        savedBy: userId ? { where: { userId } } : false,
      },
    })
    return product
  },
  findProducts: async (
    name: string,
    lastId: string,
    lastCreatedAt: Date,
    userId?: string
  ) => {
    const products = await prisma.product.findMany({
      where: {
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
  updateProduct: async (id: string, data: UpdateProductDto) => {
    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        slug: data.slug,
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        categories: data.categories,
        features: data.features,
        price: data.price,
        currency: data.currency,
        billingPeriod: data.billingPeriod,
      },
    })
    return product
  },
  updateStripeIdsById: async (id: string, stripeId: string, stripePriceId: string) => {
    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        stripeProductId: stripeId,
        stripePriceId: stripePriceId,
      },
    })
    return product
  },
  updateStripePriceIdById: async (id: string, stripePriceId: string) => {
    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        stripePriceId,
      },
    })
    return product
  },
  deleteProduct: async (id: string) => {
    const product = await prisma.product.delete({
      where: {
        id,
      },
    })
    return product
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
