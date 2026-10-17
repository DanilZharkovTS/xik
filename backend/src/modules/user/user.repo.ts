import { prisma } from '../../shared/database/prisma.js'
import { FindUsersDto } from './user.schema.js'
import { UserRole } from './user.types.js'

export const USERS_PAGE_SIZE = 50

export const userRepo = {
  findById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    })
    return user
  },
  findUsersByName: async (data: FindUsersDto, take = USERS_PAGE_SIZE) => {
    const search = data.q || data.name

    const users = await prisma.user.findMany({
      where: {
        ...(data.role ? { role: data.role } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },

      ...(data.lastId && data.lastCreatedAt
        ? {
            cursor: {
              createdAt: data.lastCreatedAt,
              id: data.lastId,
            },
            skip: 1,
          }
        : {}),

      take,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        deactivatedAt: true,
      },

      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    })

    return users
  },
  changeRoleById: async (userId: string, role: UserRole) => {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
    })
  },
}
