/** Response shape from `GET /api/youtube/analytics/channel` */
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
