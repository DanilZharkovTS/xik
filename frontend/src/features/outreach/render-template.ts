// Змінні, які знає бекенд (templates.schema.ts). Невідомих бекенд не пропустить.
export const TEMPLATE_VARIABLES = [
  'name',
  'product_name',
  'product_link',
  'manager_name',
] as const

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number]

export type TemplateValues = Partial<Record<TemplateVariable, string>>

const VARIABLE_PATTERN = /\{\{\s*([^{}]*?)\s*\}\}/g

// Підставляє лише відомі й непорожні значення; решта лишається як {{змінна}}, щоб її було видно.
export function renderTemplate(text: string, values: TemplateValues): string {
  return text.replace(VARIABLE_PATTERN, (match, name: string) => {
    const value = values[name as TemplateVariable]?.trim()
    return value ? value : match
  })
}

export function findUnfilled(text: string): string[] {
  return [...new Set([...text.matchAll(VARIABLE_PATTERN)].map((m) => m[1]))]
}
