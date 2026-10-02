import type { TokenPayload } from '../auth/auth.types.js'

interface OwnedTarget {
  ownerUserId: string
  status: 'active' | 'do_not_contact'
}

export const isOwner = (actor: TokenPayload, target: OwnedTarget): boolean =>
  target.ownerUserId === actor.id

// Історію й ідентифікатори цілі бачить лише її власник і адмін.
export const canViewDetails = (
  actor: TokenPayload,
  target: OwnedTarget
): boolean => actor.role === 'admin' || isOwner(actor, target)

// Змінювати можна лише активну ціль; «не писати» блокує дописування.
export const canModify = (actor: TokenPayload, target: OwnedTarget): boolean =>
  canViewDetails(actor, target) && target.status === 'active'
