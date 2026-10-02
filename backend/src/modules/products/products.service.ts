import { Pagination } from '../../shared/types/types.js'
import { TokenPayload } from '../auth/auth.types.js'
import { billingService } from '../billing/billing.service.js'
import { productsRepo } from './products.repo.js'
import { CreateProductDto, FindProductsDto } from './products.schema.js'

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

  findProduct: async (slug: string, user?: TokenPayload) => {
    const product = await productsRepo.findProductBySlug(slug, user?.id)

    const productWithIsSaved = {
      ...product,
      isSaved: user ? product.savedBy.length > 0 : false,
    }
    return { response: { product: productWithIsSaved } }
  },
  findProducts: async (data: FindProductsDto, user?: TokenPayload) => {
    const products = await productsRepo.findProducts(
      data.name,
      data.lastId,
      data.lastCreatedAt,
      user?.id
    )

    const productsWithIsSaved = products.map(({ savedBy, ...product }) => ({
      ...product,
      isSaved: user ? savedBy.length > 0 : false,
    }))

    const lastProduct = productsWithIsSaved.at(-1)

    return {
      response: {
        products: productsWithIsSaved,
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
  createProduct: async (data: CreateProductDto) => {
    const product = await productsRepo.createProduct(data)

    const { stripeProduct, stripePrice } =
      await billingService.createStripeProduct(product)

    const productWithStripeId = await productsRepo.updateStripeIdsById(
      product.id,
      stripeProduct.id,
      stripePrice.id
    )

    return { response: { product: productWithStripeId } }
  },
  updateProduct: async (id: string, data: CreateProductDto) => {
    console.log('data', data)
    const product = await productsRepo.findById(id)
    console.log('product', product)

    const changedData = {}

    for (const [key, value] of Object.entries(data)) {
      const oldValue = product[key]

      if (key === 'price') {
        if (oldValue.toString() !== value.toString()) {
          changedData[key] = value
        }
        continue
      }

      if (Array.isArray(oldValue) && Array.isArray(value)) {
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
          changedData[key] = value
        }
        continue
      }

      if (oldValue !== value) {
        changedData[key] = value
      }
    }
    console.log('changedData', changedData)

    const updatedProduct = await productsRepo.updateProduct(id, data)

    await billingService.updateStripeProduct(
      updatedProduct.stripeProductId,
      updatedProduct,
      changedData
    )

    return { response: { updated: updatedProduct } }
  },
  deleteProduct: async (id: string) => {
    const product = await productsRepo.deleteProduct(id)

    await billingService.deactivateStripeProduct(product.stripeProductId)

    return { response: { deleted: product } }
  },
}
