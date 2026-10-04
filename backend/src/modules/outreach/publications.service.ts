import { Prisma } from '../../generated/prisma/client.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { normalizePublicationUrl } from './normalizers.js'
import { publicationsRepo } from './publications.repo.js'
import type { AddPublicationDto, ListPublicationsDto } from './events.schema.js'

interface PublicationRow {
  id: string
  channel: string | null
  publicationKind: string | null
  url: string | null
  comment: string | null
  occurredAt: Date
  user: { name: string }
}

const toDto = (row: PublicationRow) => ({
  id: row.id,
  channel: row.channel,
  kind: row.publicationKind,
  url: row.url,
  comment: row.comment,
  occurredAt: row.occurredAt,
  author: row.user.name,
})

export const publicationsService = {
  create: async (
    actor: TokenPayload,
    productId: string,
    dto: AddPublicationDto
  ) => {
    const urlNormalized = normalizePublicationUrl(dto.url)

    if (!urlNormalized) {
      throw ApiError(
        400,
        'INVALID_URL',
        'Enter a valid http(s) link to the publication'
      )
    }

    try {
      const event = await publicationsRepo.create({
        productId,
        userId: actor.id,
        channel: dto.channel,
        publicationKind: dto.kind,
        url: dto.url,
        urlNormalized,
        comment: dto.comment,
        occurredAt: dto.occurredAt ?? new Date(),
      })

      return { status: 201, response: { publication: toDto(event) } }
    } catch (err) {
      // Часткований унікальний індекс: однакова публікація вже записана (можливо, щойно).
      if (
        !(err instanceof Prisma.PrismaClientKnownRequestError) ||
        err.code !== 'P2002'
      ) {
        throw err
      }

      const existing = await publicationsRepo.findByUrl(
        productId,
        urlNormalized
      )

      return {
        status: 409,
        response: {
          code: 'ALREADY_PUBLISHED',
          message: 'This publication is already recorded',
          existing: existing ? toDto(existing) : undefined,
        },
      }
    }
  },
  list: async (
    actor: TokenPayload,
    productId: string,
    dto: ListPublicationsDto
  ) => {
    const rows = await publicationsRepo.list({
      productId,
      // Модератор бачить свої публікації, адмін всі.
      userId: actor.role === 'admin' ? undefined : actor.id,
      lastId: dto.lastId,
      limit: dto.limit,
    })

    const hasMore = rows.length > dto.limit
    const page = hasMore ? rows.slice(0, dto.limit) : rows

    return {
      response: {
        publications: page.map(toDto),
        nextCursor: hasMore ? page.at(-1)!.id : null,
      },
    }
  },
}
