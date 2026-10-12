// Після змін продукту просимо фронтенд скинути кеш каталогу, щоб сайт і sitemap одразу
// показали нові дані. Це побічна дія: помилка сповіщення не ламає запит адміна.
// Увімкнено лише коли задано REVALIDATE_SECRET (той самий секрет, що у фронтенду).
export const notifyCatalogChanged = (): void => {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return

  const base = process.env.FRONTEND_INTERNAL_URL ?? process.env.FRONTEND_URL
  if (!base) return

  fetch(`${base.replace(/\/$/, '')}/api/revalidate`, {
    method: 'POST',
    headers: { 'x-revalidate-secret': secret },
    signal: AbortSignal.timeout(5000),
  }).catch((err: unknown) => {
    console.warn(
      'Catalog revalidation failed:',
      err instanceof Error ? err.message : err
    )
  })
}
