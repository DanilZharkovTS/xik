import { api } from '@/src/shared/api/axios'
import { UserRole } from './user.types'

export const userService = {
  findUsers: async (search: string | null, token: string) => {
    const res = await api.get('/users', {
      params: { name: search ? search : null },
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
