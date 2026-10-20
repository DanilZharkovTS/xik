import { ApiError } from '../../shared/utils/ApiError.js'
import { productsRepo } from '../products/products.repo.js'
import { userRepo } from '../user/user.repo.js'
import { libraryRepo } from './library.repo.js'
import { licenseService } from '../license/license.service.js'
import {
  GetLicenseKeyDto,
  GrantLibraryAccessDto,
  RenewLibraryAccessDto,
} from './library.schema.js'
import { TokenPayload } from '../auth/auth.types.js'

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


    return { response: {} }
  },
  renewLibraryAccess: async (data: RenewLibraryAccessDto) => {
    const libraryItem = await libraryRepo.updateLibraryItemExpiresAt(data)
    return { response: { libraryItem } }
  },
  revokeLibraryAccess: async (subscriptionId: string) => {
    const libraryItem = await libraryRepo.cancelBySubscription(subscriptionId)
    return { response: { libraryItem } }
  },
  getLicenseKey: async (user: TokenPayload, libraryItemId: string) => {
    const libraryItem = await libraryRepo.findById(libraryItemId)

    if (!libraryItem) {
      throw ApiError(404, 'LIBRARY_ITEM_NOT_FOUND', 'Library item not found')
    }

    if (user.id !== libraryItem.userId) {
      throw ApiError(
        403,
        'FORBIDDEN',
        'You do not have access to this library item'
      )
    }

    if (!libraryItem.licenseId) {
      throw ApiError(
        404,
        'LICENSE_NOT_FOUND',
        'License not found for this library item'
      )
    }

    const license = await licenseService.getLicenseById(libraryItem.licenseId)

    const licenseKey = license?.key || (license as any)?.licenseKey

    if (!licenseKey) {
      throw ApiError(404, 'LICENSE_KEY_NOT_FOUND', 'License key not found')
    }

    const fullItem = {
      ...libraryItem,
      licenseKey,
    }

    return {
      response: {
        libraryItem: fullItem,
      },
    }
  },
}
