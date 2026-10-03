// Округлена верхня межа осі й кроки сітки: 0 / 5 / 10, а не 0 / 3.7 / 7.4.
export function niceScale(max: number): { top: number; ticks: number[] } {
  if (max <= 0) return { top: 4, ticks: [0, 2, 4] }

  const magnitude = 10 ** Math.floor(Math.log10(max))
  const step =
    [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => max / candidate <= 4) ??
    10 * magnitude
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []

  for (let value = 0; value <= top; value += step) ticks.push(value)

  return { top, ticks }
}
