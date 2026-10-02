import type { TokenPayload } from '../auth/auth.types.js'
import {
  canArchiveTemplate,
  canDeleteTemplate,
  canDuplicateTemplate,
  canEditTemplate,
  canRestoreTemplate,
} from './templates.policy.js'

interface TemplateRow {
  id: string
  ownerUserId: string
  channel: string
  title: string
  subject: string | null
  body: string
  version: number
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
  owner: { name: string }
}

export const toTemplateDto = (row: TemplateRow, actor: TokenPayload) => ({
  id: row.id,
  channel: row.channel,
  title: row.title,
  subject: row.subject,
  body: row.body,
  version: row.version,
  status: row.status,
  owner: { name: row.owner.name },
  isMine: row.ownerUserId === actor.id,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  permissions: {
    canEdit: canEditTemplate(actor, row),
    canArchive: canArchiveTemplate(actor, row),
    canRestore: canRestoreTemplate(actor, row),
    canDuplicate: canDuplicateTemplate(actor, row),
    canDelete: canDeleteTemplate(actor),
  },
})
