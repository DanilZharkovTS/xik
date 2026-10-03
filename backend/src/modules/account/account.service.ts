import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import type { ContentLocale } from '../products/product.constants.js'
import { toCatalogDto } from '../products/products.mapper.js'
import { accountRepo } from './account.repo.js'
import type { UpdateAccountDto } from './account.schema.js'

type LibraryStatus = 'active' | 'canceled' | 'expired'

// active: доступ є й підписка діє; canceled: скасовано, але оплачений період ще йде; expired: доступу немає.
export const libraryStatus = (
  item: { canceledAt: Date | null; accessExpiresAt: Date | null },
  now: Date = new Date()
): LibraryStatus => {
  const hasAccess = item.accessExpiresAt === null || item.accessExpiresAt > now

  if (!hasAccess) return 'expired'
  return item.canceledAt ? 'canceled' : 'active'
}

export const accountService = {
  getProfile: async (user: TokenPayload) => {
    const profile = await accountRepo.findProfile(user.id)

    if (!profile) throw ApiError(404, 'User not found', 'USER_NOT_FOUND')

    return { response: { profile } }
  },

  updateProfile: async (user: TokenPayload, data: UpdateAccountDto) => {
    const profile = await accountRepo.update(user.id, data)

    return { response: { profile } }
  },

  listLibrary: async (user: TokenPayload, lang: ContentLocale) => {
    const items = await accountRepo.findLibrary(user.id)

    return {
      response: {
        items: items.map((item) => ({
          id: item.id,
          status: libraryStatus(item),
          accessExpiresAt: item.accessExpiresAt,
          canceledAt: item.canceledAt,
          createdAt: item.createdAt,
          product: toCatalogDto(item.product, lang),
        })),
      },
    }
  },

  listSaved: async (user: TokenPayload, lang: ContentLocale) => {
    const items = await accountRepo.findSaved(user.id)

    return {
      response: {
        products: items.map((item) => ({
          savedAt: item.createdAt,
          ...toCatalogDto(item.product, lang),
          isSaved: true,
        })),
      },
    }
  },
}
