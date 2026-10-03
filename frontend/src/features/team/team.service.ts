import { api } from '@/src/shared/api/axios'
import type { TargetListItem } from '@/src/features/outreach/outreach.types'
import type {
  CreateModeratorInput,
  Moderator,
  TeamProduct,
  TransferInput,
} from './team.types'

const withToken = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
})

export const teamService = {
  listModerators: async (token: string): Promise<Moderator[]> => {
    const res = await api.get('/team/moderators', withToken(token))
    return res.data.moderators
  },
  // Для адміна це всі продукти.
  listProducts: async (token: string): Promise<TeamProduct[]> => {
    const res = await api.get('/me/products', withToken(token))
    return res.data.products
  },
  createModerator: async (data: CreateModeratorInput, token: string) => {
    const res = await api.post('/team/moderators', data, withToken(token))
    return res.data
  },
  resetPassword: async (userId: string, password: string, token: string) => {
    const res = await api.patch(
      `/team/moderators/${userId}/password`,
      { password },
      withToken(token),
    )
    return res.data
  },
  deactivate: async (userId: string, token: string) => {
    const res = await api.post(
      `/team/moderators/${userId}/deactivate`,
      {},
      withToken(token),
    )
    return res.data
  },
  activate: async (userId: string, token: string) => {
    const res = await api.post(
      `/team/moderators/${userId}/activate`,
      {},
      withToken(token),
    )
    return res.data
  },
  grantProduct: async (userId: string, productId: string, token: string) => {
    const res = await api.post(
      `/team/moderators/${userId}/products`,
      { productId },
      withToken(token),
    )
    return res.data
  },
  revokeProduct: async (userId: string, productId: string, token: string) => {
    const res = await api.delete(
      `/team/moderators/${userId}/products/${productId}`,
      withToken(token),
    )
    return res.data
  },
  // Цілі, якими користувач володіє в продукті (цілі колишнього учасника теж лишаються за ним).
  listOwnedTargets: async (
    token: string,
    productId: string,
    ownerId: string,
    lastId?: string,
  ): Promise<{ targets: TargetListItem[]; nextCursor: string | null }> => {
    const res = await api.get('/team/targets', {
      ...withToken(token),
      params: { productId, ownerId, lastId },
    })
    return res.data
  },
  transferTargets: async (input: TransferInput, token: string): Promise<number> => {
    const res = await api.post('/team/transfer-targets', input, withToken(token))
    return res.data.transferred
  },
}
