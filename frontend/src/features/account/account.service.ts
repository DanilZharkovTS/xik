import { api } from '@/src/shared/api/axios'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import type { ApiCatalogProduct } from '@/src/features/catalog/catalog.types'

export type LibraryStatus = 'active' | 'canceled' | 'expired'

export interface AccountProfile {
  id: string
  email: string
  name: string
  role: 'user' | 'admin' | 'moderator'
  locale: Locale
  createdAt: string
}

export interface LibraryItem {
  id: string
  status: LibraryStatus
  accessExpiresAt: string | null
  canceledAt: string | null
  createdAt: string
  product: ApiCatalogProduct
}

export type SavedProduct = ApiCatalogProduct & { savedAt: string }

const withToken = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export const accountService = {
  profile: async (token: string): Promise<AccountProfile> =>
    (await api.get('/account', withToken(token))).data.profile,

  update: async (
    data: { name?: string; locale?: Locale },
    token: string,
  ): Promise<AccountProfile> =>
    (await api.patch('/account', data, withToken(token))).data.profile,

  library: async (locale: Locale, token: string): Promise<LibraryItem[]> =>
    (await api.get('/account/library', { params: { lang: locale }, ...withToken(token) })).data.items,

  saved: async (locale: Locale, token: string): Promise<SavedProduct[]> =>
    (await api.get('/account/saved', { params: { lang: locale }, ...withToken(token) })).data.products,

  // Зберегти й прибрати це один і той самий запит-перемикач на бекенді.
  toggleSaved: async (productId: string, token: string): Promise<boolean> => {
    const res = await api.post(`/products/${productId}/save`, {}, withToken(token))
    return Boolean(res.data.saved)
  },
}
