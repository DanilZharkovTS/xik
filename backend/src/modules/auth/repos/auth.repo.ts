import { prisma } from '../../../shared/database/prisma.js'
import { RegisterDto } from '.././auth.schema.js'

export const authRepo = {
  createUser: async (data: RegisterDto) => {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        credentials: {
          create: {
            passwordHash: data.password,
            passwordUpdatedAt: new Date(),
          },
        },
      },
    })
    return user
  },
  findUserByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    })
    return user
  },
  findUserWithCredentialsByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      include: {
        credentials: true,
      },
    })
    return user
  },
}
