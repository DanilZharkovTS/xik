// Англійський і український тексти лежать поруч, а тип змушує мати однакові ключі в обох мовах.
export function defineMessages<const T extends Record<string, string>>(
  en: T,
  uk: Record<keyof T, string>,
): { en: T; uk: Record<keyof T, string> } {
  return { en, uk }
}
