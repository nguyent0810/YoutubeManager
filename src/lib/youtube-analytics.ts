import { auth } from "@/lib/auth"

const ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2"

async function getBearer(): Promise<string> {
  const session = await auth()
  const token = session?.accessToken
  if (!token) throw new Error("Unauthorized: No YouTube access token found.")
  return token
}

export interface ChannelAnalyticsRow {
  day?: string
  views: number
  estimatedMinutesWatched: number
  subscribersGained: number
}

export interface ChannelAnalyticsResult {
  rows: ChannelAnalyticsRow[]
  columnHeaders: { name: string; columnType: string; dataType: string }[]
}

/** Daily channel metrics for charts (last N days as date range). */
export async function getChannelDailyAnalytics(
  startDate: string,
  endDate: string
): Promise<ChannelAnalyticsResult> {
  const accessToken = await getBearer()
  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,subscribersGained",
    dimensions: "day",
    sort: "day",
  })

  const res = await fetch(`${ANALYTICS_BASE}/reports?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(
      `YouTube Analytics error (${res.status}): ${err.slice(0, 200)}`
    )
  }

  const data = (await res.json()) as {
    columnHeaders?: { name: string; columnType: string; dataType: string }[]
    rows?: (string | number)[][]
  }

  const headers = data.columnHeaders ?? []
  const nameIdx = (n: string) =>
    headers.findIndex((h) => h.name === n)

  const dayI = nameIdx("day")
  const viewsI = nameIdx("views")
  const minutesI = nameIdx("estimatedMinutesWatched")
  const subsI = nameIdx("subscribersGained")

  const rows: ChannelAnalyticsRow[] = (data.rows ?? []).map((r) => ({
    day: dayI >= 0 ? String(r[dayI]) : undefined,
    views: viewsI >= 0 ? Number(r[viewsI]) || 0 : 0,
    estimatedMinutesWatched:
      minutesI >= 0 ? Number(r[minutesI]) || 0 : 0,
    subscribersGained: subsI >= 0 ? Number(r[subsI]) || 0 : 0,
  }))

  return { rows, columnHeaders: headers }
}

export interface VideoAnalyticsResult {
  views: number
  estimatedMinutesWatched: number
  averageViewDuration?: number
}

export async function getVideoAnalytics(
  videoId: string,
  startDate: string,
  endDate: string
): Promise<VideoAnalyticsResult> {
  const accessToken = await getBearer()
  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration",
    filters: `video==${videoId}`,
  })

  const res = await fetch(`${ANALYTICS_BASE}/reports?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(
      `YouTube Analytics error (${res.status}): ${err.slice(0, 200)}`
    )
  }

  const data = (await res.json()) as {
    columnHeaders?: { name: string }[]
    rows?: (string | number)[][]
  }
  const headers = data.columnHeaders ?? []
  const idx = (n: string) => headers.findIndex((h) => h.name === n)
  const row = data.rows?.[0] ?? []

  return {
    views: idx("views") >= 0 ? Number(row[idx("views")]) || 0 : 0,
    estimatedMinutesWatched:
      idx("estimatedMinutesWatched") >= 0
        ? Number(row[idx("estimatedMinutesWatched")]) || 0
        : 0,
    averageViewDuration:
      idx("averageViewDuration") >= 0
        ? Number(row[idx("averageViewDuration")]) || undefined
        : undefined,
  }
}
