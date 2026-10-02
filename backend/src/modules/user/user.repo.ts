import { prisma } from '../../shared/database/prisma.js'
import { FindUsersDto } from './user.schema.js'
import { UserRole } from './user.types.js'

export const userRepo = {
  findById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    })
    return user
  },
  findUsersByName: async (
    data: FindUsersDto
  ) => {
    const users = await prisma.user.findMany({
      where: data.name
        ? {
            name: {
              contains: data.name,
              mode: 'insensitive',
            },
          }
        : undefined,

      ...(data.lastId && data.lastCreatedAt
        ? {
            cursor: {
              createdAt: data.lastCreatedAt,
              id: data.lastId,
            },
            skip: 1,
          }
        : {}),

      take: 50,

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
        role
      },
    })
  },
}
