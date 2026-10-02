// Одноразове створення (або підвищення до адміна) першого користувача.
// Запуск: ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run admin:create
// Якщо користувач з таким e-mail уже є, він лише отримує роль admin, пароль не змінюється.
import bcrypt from 'bcrypt'
import { prisma } from '../shared/database/prisma.js'
import { auditRepo } from '../modules/audit/audit.repo.js'

const main = async () => {
  const email = process.env.ADMIN_EMAIL?.trim()
  const name = process.env.ADMIN_NAME?.trim() || 'Admin'
  const password = process.env.ADMIN_PASSWORD

  if (!email) {
    throw new Error('ADMIN_EMAIL is required')
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })

  if (existing) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.id },
        data: { role: 'admin', deactivatedAt: null },
      })
      await auditRepo.record(
        { actorUserId: existing.id, action: 'admin_bootstrapped' },
        tx
      )
    })
    console.log(`User ${existing.email} is now admin`)
    return
  }

  if (!password || password.length < 8 || password.length > 72) {
    throw new Error('ADMIN_PASSWORD (8-72 characters) is required for a new admin')
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: name.slice(0, 50),
        role: 'admin',
        credentials: { create: { passwordHash } },
      },
    })
    await auditRepo.record(
      { actorUserId: user.id, action: 'admin_bootstrapped' },
      tx
    )
  })
  console.log(`Admin ${email} created`)
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
