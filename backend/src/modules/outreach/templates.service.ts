import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { auditRepo } from '../audit/audit.repo.js'
import {
  canArchiveTemplate,
  canDeleteTemplate,
  canDuplicateTemplate,
  canEditTemplate,
  canRestoreTemplate,
  canViewTemplate,
} from './templates.policy.js'
import { toTemplateDto } from './templates.mapper.js'
import { templatesRepo } from './templates.repo.js'
import type {
  CreateTemplateDto,
  ListTemplatesDto,
  UpdateTemplateDto,
} from './templates.schema.js'

// Тема має сенс лише для листів і універсальних шаблонів.
const allowsSubject = (channel: string): boolean =>
  channel === 'email' || channel === 'any'

// Архівний шаблон для сторонніх не існує: 404, а не 403, щоб не розкривати його наявність.
const findVisible = async (
  actor: TokenPayload,
  productId: string,
  id: string
) => {
  const template = await templatesRepo.findById(productId, id)

  if (!template || !canViewTemplate(actor, template)) {
    throw ApiError(404, 'TEMPLATE_NOT_FOUND', 'Template not found')
  }

  return template
}

const forbid = () =>
  ApiError(403, 'FORBIDDEN', 'Only the owner or an administrator can change this template')

export const templatesService = {
  list: async (actor: TokenPayload, productId: string, dto: ListTemplatesDto) => {
    const templates = await templatesRepo.list({
      productId,
      status: dto.status,
      channel: dto.channel,
      // Свої архівні бачить кожен, чужі лише адмін.
      ownerUserId:
        dto.status === 'archived' && actor.role !== 'admin' ? actor.id : undefined,
    })

    return {
      response: { templates: templates.map((t) => toTemplateDto(t, actor)) },
    }
  },
  get: async (actor: TokenPayload, productId: string, id: string) => {
    const template = await findVisible(actor, productId, id)
    return { response: { template: toTemplateDto(template, actor) } }
  },
  create: async (actor: TokenPayload, productId: string, dto: CreateTemplateDto) => {
    const template = await templatesRepo.create({
      productId,
      ownerUserId: actor.id,
      channel: dto.channel,
      title: dto.title,
      subject: allowsSubject(dto.channel) ? (dto.subject ?? null) : null,
      body: dto.body,
    })

    return { response: { template: toTemplateDto(template, actor) } }
  },
  update: async (
    actor: TokenPayload,
    productId: string,
    id: string,
    dto: UpdateTemplateDto
  ) => {
    const template = await findVisible(actor, productId, id)

    if (!canEditTemplate(actor, template)) {
      if (template.status === 'archived') {
        throw ApiError(409, 'TEMPLATE_ARCHIVED', 'Restore the template before editing it')
      }
      throw forbid()
    }

    const channel = dto.channel ?? template.channel
    // Після зміни каналу на не-листовий тема стає недоречною й очищається.
    const subject = allowsSubject(channel)
      ? dto.subject === undefined
        ? template.subject
        : dto.subject
      : null

    const next = {
      channel,
      title: dto.title ?? template.title,
      subject,
      body: dto.body ?? template.body,
    }

    const isChanged =
      next.channel !== template.channel ||
      next.title !== template.title ||
      next.subject !== template.subject ||
      next.body !== template.body

    if (isChanged) {
      const isUpdated = await templatesRepo.updateIfVersion(id, dto.expectedVersion, next)

      if (!isUpdated) {
        const current = await templatesRepo.findById(productId, id)

        return {
          status: 409,
          response: {
            code: 'STALE_VERSION',
            message: 'The template was changed meanwhile. Review the latest version.',
            template: current ? toTemplateDto(current, actor) : undefined,
          },
        }
      }
    }

    const updated = await templatesRepo.findById(productId, id)

    return { status: 200, response: { template: toTemplateDto(updated!, actor) } }
  },
  archive: async (actor: TokenPayload, productId: string, id: string) => {
    const template = await findVisible(actor, productId, id)

    if (template.status === 'archived') {
      throw ApiError(409, 'ALREADY_ARCHIVED', 'Template is already archived')
    }
    if (!canArchiveTemplate(actor, template)) throw forbid()

    await templatesRepo.setStatus(id, 'archived')

    const updated = await templatesRepo.findById(productId, id)
    return { response: { template: toTemplateDto(updated!, actor) } }
  },
  restore: async (actor: TokenPayload, productId: string, id: string) => {
    const template = await findVisible(actor, productId, id)

    if (template.status === 'active') {
      throw ApiError(409, 'NOT_ARCHIVED', 'Template is not archived')
    }
    if (!canRestoreTemplate(actor, template)) throw forbid()

    await templatesRepo.setStatus(id, 'active')

    const updated = await templatesRepo.findById(productId, id)
    return { response: { template: toTemplateDto(updated!, actor) } }
  },
  // Чужий шаблон не змінюють, а дублюють собі й правлять копію.
  duplicate: async (actor: TokenPayload, productId: string, id: string) => {
    const template = await findVisible(actor, productId, id)

    if (!canDuplicateTemplate(actor, template)) {
      throw ApiError(409, 'TEMPLATE_ARCHIVED', 'Restore the template before duplicating it')
    }

    const copy = await templatesRepo.create({
      productId,
      ownerUserId: actor.id,
      channel: template.channel,
      title: `Copy of ${template.title}`.slice(0, 100),
      subject: template.subject,
      body: template.body,
    })

    return { response: { template: toTemplateDto(copy, actor) } }
  },
  // Видалити остаточно можна лише невикористаний шаблон: журнал подій має лишатися цілісним.
  remove: async (actor: TokenPayload, productId: string, id: string) => {
    if (!canDeleteTemplate(actor)) throw forbid()

    await prisma.$transaction(async (tx) => {
      const template = await templatesRepo.findById(productId, id, tx)

      if (!template) {
        throw ApiError(404, 'TEMPLATE_NOT_FOUND', 'Template not found')
      }

      if ((await templatesRepo.countEvents(id, tx)) > 0) {
        throw ApiError(
          409,
          'TEMPLATE_IN_USE',
          'This template was used in the journal. Archive it instead of deleting.'
        )
      }

      await templatesRepo.remove(id, tx)
      await auditRepo.record(
        {
          actorUserId: actor.id,
          action: 'template_deleted',
          targetUserId: template.ownerUserId,
          productId,
          meta: { title: template.title },
        },
        tx
      )
    })

    return { response: { deleted: true } }
  },
  // Для подій: шаблон має бути активним у цьому продукті; фіксуємо його поточну версію.
  resolveForEvent: async (productId: string, templateId: string | undefined) => {
    if (!templateId) return null

    const template = await templatesRepo.findById(productId, templateId)

    if (!template) {
      throw ApiError(404, 'TEMPLATE_NOT_FOUND', 'Template not found')
    }
    if (template.status !== 'active') {
      throw ApiError(409, 'TEMPLATE_ARCHIVED', 'This template is archived')
    }

    return { templateId: template.id, templateVersion: template.version }
  },
}
