import { ApiError } from '../../shared/utils/ApiError.js'
import { TokenPayload } from '../auth/auth.types.js'
import { userRepo } from './user.repo.js'
import { FindUsersDto } from './user.schema.js'
import { UserRole } from './user.types.js'
import { prisma } from '../../shared/database/prisma.js'
import { auditRepo } from '../audit/audit.repo.js'

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
    await prisma.$transaction(async (tx) => {
      // Serialize role changes so two administrators cannot both remove the last admin.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(78123451)`
      const actor = await tx.user.findUnique({ where: { id: myId } })
      if (!actor || actor.role !== 'admin' || actor.deactivatedAt) {
        throw ApiError(403, 'FORBIDDEN', 'Not enough permissions')
      }
      const target = await tx.user.findUnique({ where: { id: userId } })
      if (!target) throw ApiError(404, 'USER_NOT_FOUND', 'User not found')
      if (target.role === role) return
      if (target.role === 'admin' && !target.deactivatedAt && role !== 'admin') {
        const admins = await tx.user.count({ where: { role: 'admin', deactivatedAt: null } })
        if (admins <= 1) throw ApiError(409, 'LAST_ADMIN', 'At least one active administrator is required')
      }
      await tx.user.update({ where: { id: userId }, data: { role } })
      await auditRepo.record({ actorUserId: myId, action: 'user_role_changed', targetUserId: userId, meta: { from: target.role, to: role } }, tx)
    })

    return { response: { newRole: role } }
  },
}
