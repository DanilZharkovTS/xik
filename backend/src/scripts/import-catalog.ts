// Імпорт продуктів і агентів зі статичного каталогу (prisma/seed/catalog.json) у БД і Stripe.
//   npm run products:import                 створює відсутні продукти й привʼязує їх до Stripe
//   npm run products:import -- --no-stripe  лише БД (привʼязати до Stripe можна пізніше в адмінці)
// Наявні продукти пропускаються, тож команду безпечно запускати повторно.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { prisma } from '../shared/database/prisma.js'
import { importCatalog } from '../modules/products/catalog-import.js'

const main = async () => {
  const file = fileURLToPath(new URL('../../prisma/seed/catalog.json', import.meta.url))
  const items = JSON.parse(readFileSync(file, 'utf8')) as unknown[]

  const wantsStripe = !process.argv.includes('--no-stripe')
  const hasKey = (process.env.STRIPE_SECRET ?? '').startsWith('sk_')

  if (wantsStripe && !hasKey) {
    console.warn('STRIPE_SECRET is missing or invalid: importing without Stripe (use "Sync with Stripe" later).')
  }

  const result = await importCatalog(items, { useStripe: wantsStripe && hasKey })

  console.log(`Created: ${result.created.length}${result.created.length ? ` (${result.created.join(', ')})` : ''}`)
  console.log(`Skipped (already exist): ${result.skipped.length}`)
  console.log(`Translations added to existing products: ${result.translated.length}`)

  if (result.failed.length > 0) {
    console.error(`Failed: ${result.failed.length}`)
    for (const failure of result.failed) console.error(`  ${failure.slug}: ${failure.error}`)
    process.exitCode = 1
  }

  console.log('Temporary prices are hidden from visitors: set real ones in Admin -> Products.')
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
