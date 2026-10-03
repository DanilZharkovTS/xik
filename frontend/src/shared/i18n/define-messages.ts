// Англійський і український тексти лежать поруч, а тип змушує мати однакові ключі в обох мовах.
// Так описано інтерфейс кабінету модератора й адміна (лише EN і UK).
export function defineMessages<const T extends Record<string, string>>(
  en: T,
  uk: Record<keyof T, string>,
): { en: T; uk: Record<keyof T, string>; es?: undefined } {
  return { en, uk }
}

// Публічна частина й кабінет клієнта: усі три мови, і тип вимагає однакових ключів.
export function defineTrilingual<const T extends Record<string, string>>(
  en: T,
  es: Record<keyof T, string>,
  uk: Record<keyof T, string>,
): { en: T; es: Record<keyof T, string>; uk: Record<keyof T, string> } {
  return { en, es, uk }
}
