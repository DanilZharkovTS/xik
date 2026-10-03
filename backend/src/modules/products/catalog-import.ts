import { randomUUID } from 'node:crypto'
import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../shared/database/prisma.js'
import { productsRepo } from './products.repo.js'
import { createProductSchema, type CreateProductDto } from './products.schema.js'

export interface ImportResult {
  created: string[]
  skipped: string[]
  // Наявні продукти без перекладів, яким дописано переклади з каталогу.
  translated: string[]
  failed: { slug: string; error: string }[]
}

// Ідемпотентний імпорт: наявні за slug продукти не чіпаємо (їх уже редагують в адмінці).
// Єдиний виняток: продукту без жодного перекладу дописуються переклади з каталогу.
// Зі Stripe кожен продукт створюється тим самим шляхом, що й в адмінці; без Stripe лишається
// непривʼязаним, і його привʼязує кнопка "Sync with Stripe".
export async function importCatalog(
  rawItems: unknown[],
  options: { useStripe: boolean }
): Promise<ImportResult> {
  const result: ImportResult = { created: [], skipped: [], translated: [], failed: [] }

  for (const raw of rawItems) {
    const slug = String((raw as { slug?: unknown })?.slug ?? '?')

    try {
      const parsed = createProductSchema.safeParse(raw)

      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '))
      }

      const data: CreateProductDto = parsed.data

      const existing = await prisma.product.findUnique({
        where: { slug: data.slug },
        select: { id: true, translations: true },
      })

      if (existing) {
        const hasOwn = Object.keys((existing.translations ?? {}) as object).length > 0

        if (!hasOwn && Object.keys(data.translations).length > 0) {
          await prisma.product.update({
            where: { id: existing.id },
            data: { translations: data.translations as Prisma.InputJsonValue },
          })
          result.translated.push(data.slug)
        } else {
          result.skipped.push(data.slug)
        }
        continue
      }

      if (options.useStripe) {
        // Підвантажуємо лише тут: модуль Stripe падає без ключа, а імпорт без Stripe має працювати.
        const { productsService } = await import('./products.service.js')
        await productsService.createProduct(data)
      } else {
        await productsRepo.createProduct(randomUUID(), data, null)
      }

      result.created.push(data.slug)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err)
      result.failed.push({ slug, error: message })
    }
  }

  return result
}
