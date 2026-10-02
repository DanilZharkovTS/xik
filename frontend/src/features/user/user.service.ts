import { api } from '@/src/shared/api/axios'
import { UserRole } from './user.types'

export const userService = {
  findUsers: async (search: string | null, token: string) => {
    const res = await api.get('http://localhost:3000/api/users', {
      params: { name: search ? search : null },
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
  changeRole: async (userId: string, role: UserRole, token: string) => {
    const res = await  api.patch(`http://localhost:3000/api/users/${userId}`, {  role }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
}
