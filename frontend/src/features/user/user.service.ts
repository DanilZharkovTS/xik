import { api } from '@/src/shared/api/axios'
import type { UserRole, UsersPage, UsersQuery } from './user.types'

export const userService = {
  findUsers: async (query: UsersQuery, token: string): Promise<UsersPage> => {
    const res = await api.get('/users', {
      params: {
        q: query.q || undefined,
        role: query.role,
        lastId: query.cursor?.lastId,
        lastCreatedAt: query.cursor?.lastCreatedAt,
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
  changeRole: async (userId: string, role: UserRole, token: string) => {
    const res = await api.patch(`/users/${userId}`, { role }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
}
