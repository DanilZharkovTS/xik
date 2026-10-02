import { prisma, type DbClient } from '../../shared/database/prisma.js'
import { Prisma } from '../../generated/prisma/client.js'

export type AuditAction =
  | 'admin_bootstrapped'
  | 'moderator_created'
  | 'password_reset'
  | 'user_deactivated'
  | 'user_activated'
  | 'product_granted'
  | 'product_revoked'
  | 'target_do_not_contact'
  | 'target_released'

export interface AuditRecord {
  actorUserId: string
  action: AuditAction
  targetUserId?: string
  productId?: string
  // Лише службові дані. Паролі, токени й хеші сюди не передаються.
  meta?: Prisma.InputJsonValue
}

export const auditRepo = {
  record: async (data: AuditRecord, db: DbClient = prisma) => {
    await db.auditEvent.create({ data })
  },
}
