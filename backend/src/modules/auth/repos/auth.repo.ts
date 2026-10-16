import { prisma, type DbClient } from '../../../shared/database/prisma.js'
import { RegisterDto } from '.././auth.schema.js'

export const authRepo = {
  createUser: async (data: RegisterDto) => {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        locale: data.locale,
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
  findUserById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id,
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
  findUserWithCredentialsById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        credentials: true,
      },
    })
    return user
  },
  updatePassword: async (
    userId: string,
    passwordHash: string,
    db: DbClient = prisma
  ) => {
    return db.userCredentials.update({
      where: { userId },
      data: {
        passwordHash,
        passwordUpdatedAt: new Date(),
      },
    })
  },
}
