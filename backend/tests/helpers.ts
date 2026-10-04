import bcrypt from 'bcrypt'
import request from 'supertest'
import { app } from '../src/app.js'
import { prisma } from '../src/shared/database/prisma.js'

export const api = () => request(app)

export const resetDb = async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "BillingEvent", "OutreachEvent", "OutreachIdentifier", "OutreachTarget", "AuditEvent", "ProductMembership", "RefreshToken", "UserSession", "UserCredentials", "SavedProduct", "UserLibrary", "Product", "ArticleTranslation", "Article", "ArticleTag", "ArticleCategory", "MediaAsset", "User" RESTART IDENTITY CASCADE`
  )
}

export const createUser = async (
  role: 'admin' | 'moderator' | 'user',
  email: string,
  password = 'password-123'
) => {
  return prisma.user.create({
    data: {
      email,
      name: email.split('@')[0],
      role,
      credentials: {
        create: { passwordHash: await bcrypt.hash(password, 4) },
      },
    },
  })
}

let productCounter = 0

export const createProduct = async (name = 'Product') => {
  productCounter += 1
  return prisma.product.create({
    data: {
      slug: `product-${productCounter}-${Date.now()}`,
      name: `${name} ${productCounter}`,
      shortDescription: 'short',
      description: 'description',
      categories: [],
      features: [],
      price: 10,
      currency: 'USD',
      billingPeriod: 'month',
    },
  })
}

export const login = async (email: string, password = 'password-123') => {
  const res = await api().post('/api/auth/login').send({ email, password })
  return {
    status: res.status,
    accessToken: res.body.accessToken as string,
    cookies: res.headers['set-cookie'] as unknown as string[] | undefined,
  }
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

export const loginOk = async (email: string, password = 'password-123') => {
  const result = await login(email, password)
  if (result.status !== 200) {
    throw new Error(`login failed for ${email}: ${result.status}`)
  }
  return result
}

export const grant = async (userId: string, productId: string, grantedById: string) => {
  return prisma.productMembership.create({
    data: { userId, productId, grantedById },
  })
}

export const inProduct = (token: string, productId: string) => ({
  Authorization: `Bearer ${token}`,
  'X-Product-Id': productId,
})
