import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number | string): string {
  const num = typeof n === "string" ? parseInt(n, 10) : n
  if (isNaN(num)) return "0"

  if (num >= 1000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  return num.toString()
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0s"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || h > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)

  return parts.join(" ")
}

export function formatPercentage(v: number): string {
  if (isNaN(v)) return "0%"
  return `${(v * 100).toFixed(1)}%`
}

export function getRelativeTime(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return ""

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" })

  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, "second")
  if (diffInSeconds < 3600)
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute")
  if (diffInSeconds < 86400)
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour")
  if (diffInSeconds < 2592000)
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day")
  if (diffInSeconds < 31536000)
    return rtf.format(-Math.floor(diffInSeconds / 2592000), "month")
  return rtf.format(-Math.floor(diffInSeconds / 31536000), "year")
}

export function calculateEngagementRate(
  likes: number,
  comments: number,
  views: number
): number {
  if (!views || views === 0) return 0
  return (likes + comments) / views
}

export function parseDuration(isoString: string): number {
  const match = isoString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const h = parseInt(match[1] || "0", 10)
  const m = parseInt(match[2] || "0", 10)
  const s = parseInt(match[3] || "0", 10)

  return h * 3600 + m * 60 + s
}
