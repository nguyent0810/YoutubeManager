export interface YouTubeChannel {
  id: string
  title: string
  description: string
  customUrl: string
  publishedAt: string
  thumbnailUrl: string
  subscriberCount: string
  videoCount: string
  viewCount: string
}

export interface YouTubeVideoSnippet {
  publishedAt: string
  channelId: string
  title: string
  description: string
  thumbnails: {
    default: { url: string; width: number; height: number }
    medium: { url: string; width: number; height: number }
    high: { url: string; width: number; height: number }
  }
}

export interface YouTubeVideoStatistics {
  viewCount?: string
  likeCount?: string
  commentCount?: string
}

export interface YouTubeVideoContentDetails {
  duration: string
  dimension: string
  definition: string
}

export type PrivacyStatus = "public" | "private" | "unlisted"

export interface YouTubeVideoStatus {
  privacyStatus: PrivacyStatus
  uploadStatus: string
}

export interface YouTubeVideo {
  id: string
  snippet: YouTubeVideoSnippet
  statistics?: YouTubeVideoStatistics
  contentDetails: YouTubeVideoContentDetails
  status?: YouTubeVideoStatus
}

export interface YouTubeSearchResultId {
  videoId: string
}

export interface YouTubeSearchItem {
  id: YouTubeSearchResultId
  snippet: Pick<
    YouTubeVideoSnippet,
    "publishedAt" | "channelId" | "title" | "description" | "thumbnails"
  >
}

export interface YouTubeVideosResponse {
  videos: YouTubeVideo[]
  nextPageToken?: string
  totalResults: number
}
