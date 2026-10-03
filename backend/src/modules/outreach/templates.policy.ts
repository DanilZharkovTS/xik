import type { TokenPayload } from '../auth/auth.types.js'

interface TemplateRow {
  ownerUserId: string
  status: 'active' | 'archived'
}

const isOwnerOrAdmin = (actor: TokenPayload, template: TemplateRow): boolean =>
  actor.role === 'admin' || template.ownerUserId === actor.id

// Активні шаблони продукту бачать і копіюють усі; архівні лише власник і адмін.
export const canViewTemplate = (
  actor: TokenPayload,
  template: TemplateRow
): boolean => template.status === 'active' || isOwnerOrAdmin(actor, template)

// Варіант А: чужий шаблон менеджер не змінює, а дублює собі.
export const canEditTemplate = (
  actor: TokenPayload,
  template: TemplateRow
): boolean => template.status === 'active' && isOwnerOrAdmin(actor, template)

export const canArchiveTemplate = canEditTemplate

export const canRestoreTemplate = (
  actor: TokenPayload,
  template: TemplateRow
): boolean => template.status === 'archived' && isOwnerOrAdmin(actor, template)

// Остаточно видаляє лише адмін (і лише невикористаний шаблон, це перевіряє сервіс).
export const canDeleteTemplate = (actor: TokenPayload): boolean =>
  actor.role === 'admin'

export const canDuplicateTemplate = (
  actor: TokenPayload,
  template: TemplateRow
): boolean => template.status === 'active' && canViewTemplate(actor, template)
