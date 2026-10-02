import { randomUUID } from 'node:crypto'
import { prisma } from '../../shared/database/prisma.js'
import { productsRepo } from './products.repo.js'
import { createProductSchema, type CreateProductDto } from './products.schema.js'
import { productsService } from './products.service.js'

export interface ImportResult {
  created: string[]
  skipped: string[]
  failed: { slug: string; error: string }[]
}

// Ідемпотентний імпорт: наявні за slug продукти не чіпаємо (їх уже редагують в адмінці).
// Зі Stripe кожен продукт створюється тим самим шляхом, що й в адмінці; без Stripe лишається
// непривʼязаним, і його привʼязує кнопка "Sync with Stripe".
export async function importCatalog(
  rawItems: unknown[],
  options: { useStripe: boolean }
): Promise<ImportResult> {
  const result: ImportResult = { created: [], skipped: [], failed: [] }

  for (const raw of rawItems) {
    const slug = String((raw as { slug?: unknown })?.slug ?? '?')

    try {
      const parsed = createProductSchema.safeParse(raw)

      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '))
      }

      const data: CreateProductDto = parsed.data

      if (await prisma.product.findUnique({ where: { slug: data.slug }, select: { id: true } })) {
        result.skipped.push(data.slug)
        continue
      }

      if (options.useStripe) {
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
