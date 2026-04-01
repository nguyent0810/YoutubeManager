/** Local calendar date as `YYYY-MM-DD` (matches YouTube Analytics query params). */
export function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Inclusive range ending today: `days` calendar days including today. */
export function rangeEndingToday(days: number): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  return { startDate: toYmd(start), endDate: toYmd(end) }
}
