// Через скільки днів без відповіді контакт вважається "закинутим" і потрапляє в "Потребує дії".
export const followUpDays = (): number => {
  const value = Number(process.env.FOLLOW_UP_DAYS ?? 3)
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 3
}

export const followUpCutoff = (now: Date = new Date()): Date =>
  new Date(now.getTime() - followUpDays() * 24 * 60 * 60 * 1000)
