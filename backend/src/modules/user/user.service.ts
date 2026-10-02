import { ApiError } from '../../shared/utils/ApiError.js'
import { TokenPayload } from '../auth/auth.types.js'
import { userRepo } from './user.repo.js'
import { FindUsersDto } from './user.schema.js'
import { UserRole } from './user.types.js'

export const userService = {
  findUsers: async (data: FindUsersDto) => {
    const users = await userRepo.findUsersByName(data)

    const lastId = users.at(-1)?.id
    const lastCreatedAt = users.at(-1)?.createdAt

    return { response: { users, search: data.name, lastId, lastCreatedAt } }
  },
  //admin
  changeUserRole: async (
    { id: myId }: TokenPayload,
    userId: string,
    role: UserRole
  ) => {
    const user = await userRepo.findById(myId)

    if (user.role !== 'admin') {
      throw ApiError(403, 'FORBIDDEN', 'Not enough permissions')
    }

    await userRepo.changeRoleById(userId, role)

    return { response: { newRole: role } }
  },
}
