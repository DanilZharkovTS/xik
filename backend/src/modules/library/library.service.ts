import { ApiError } from '../../shared/utils/ApiError.js'
import { productsRepo } from '../products/products.repo.js'
import { userRepo } from '../user/user.repo.js'
import { libraryRepo } from './library.repo.js'
import {
  GrantLibraryAccessDto,
  RenewLibraryAccessDto,
} from './library.schema.js'

export const libraryService = {
  grantLibraryAccess: async (data: GrantLibraryAccessDto) => {
    const user = await userRepo.findById(data.userId)

    if (!user) {
      throw ApiError(404, 'User not found', 'USER_NOT_FOUND')
    }

    const product = await productsRepo.findById(data.productId)

    if (!product) {
      throw ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
    }

    const libraryItem = await libraryRepo.addLibraryItem(data)

    return { response: { libraryItem } }
  },
  renewLibraryAccess: async (data: RenewLibraryAccessDto) => {
    const libraryItem = await libraryRepo.updateLibraryItemExpiresAt(data)
    return { response: { libraryItem } }
  },
  revokeLibraryAccess: async (subscriptionId: string) => {
    const libraryItem = await libraryRepo.cancelBySubscription(subscriptionId)
    return { response: { libraryItem } }
  },
}
