// Обрізає по межі слова: заголовок до ~60 символів, опис до ~160, як показує пошукова видача.
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean

  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')

  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, '')}…`
}
