import { auth } from "@/lib/auth"
import type {
  YouTubeChannel,
  YouTubeSearchItem,
  YouTubeVideosResponse,
  YouTubeVideo,
  PrivacyStatus,
} from "@/types/youtube"

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

async function getAuthHeader(): Promise<HeadersInit> {
  const session = await auth()
  const accessToken = session?.accessToken

  if (!accessToken) {
    throw new Error("Unauthorized: No YouTube access token found.")
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  }
}

export type VideoSearchOrder =
  | "date"
  | "rating"
  | "relevance"
  | "title"
  | "videoCount"
  | "viewCount"

export interface ListVideosOptions {
  pageToken?: string
  maxResults?: number
  q?: string
  privacy?: PrivacyStatus | "all"
  order?: VideoSearchOrder
}

export async function getMyChannel(): Promise<YouTubeChannel> {
  const headers = await getAuthHeader()
  const res = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&mine=true`,
    { headers }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch channel: ${res.statusText}`)
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: string
      snippet: {
        title: string
        description: string
        customUrl: string
        publishedAt: string
        thumbnails?: { default?: { url: string } }
      }
      statistics: {
        subscriberCount: string
        videoCount: string
        viewCount: string
      }
    }>
  }
  const channel = data.items?.[0]

  if (!channel) {
    throw new Error("No channel found for this user.")
  }

  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    customUrl: channel.snippet.customUrl,
    publishedAt: channel.snippet.publishedAt,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url || "",
    subscriberCount: channel.statistics.subscriberCount,
    videoCount: channel.statistics.videoCount,
    viewCount: channel.statistics.viewCount,
  }
}

export async function getChannelVideos(
  channelId: string,
  options: ListVideosOptions = {}
): Promise<YouTubeVideosResponse> {
  const headers = await getAuthHeader()
  const {
    pageToken,
    maxResults = 50,
    q,
    privacy = "all",
    order = "date",
  } = options

  const searchParams = new URLSearchParams({
    part: "snippet",
    channelId,
    order,
    type: "video",
    maxResults: String(maxResults),
  })

  if (pageToken) searchParams.append("pageToken", pageToken)
  if (q?.trim()) searchParams.append("q", q.trim())

  const searchRes = await fetch(
    `${YOUTUBE_API_BASE}/search?${searchParams.toString()}`,
    { headers }
  )
  if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.statusText}`)
  const searchData = (await searchRes.json()) as {
    items?: YouTubeSearchItem[]
    nextPageToken?: string
    pageInfo: { totalResults: number }
  }

  const videoIds =
    searchData.items?.map((item) => item.id.videoId).filter(Boolean).join(",") ||
    ""

  if (!videoIds) {
    return { videos: [], totalResults: searchData.pageInfo.totalResults }
  }

  const videoParams = new URLSearchParams({
    part: "snippet,statistics,contentDetails,status",
    id: videoIds,
  })

  const videoRes = await fetch(
    `${YOUTUBE_API_BASE}/videos?${videoParams.toString()}`,
    { headers }
  )
  if (!videoRes.ok) throw new Error(`Videos failed: ${videoRes.statusText}`)
  const videoData = (await videoRes.json()) as { items: YouTubeVideo[] }

  let videos = videoData.items ?? []
  if (privacy !== "all") {
    videos = videos.filter((v) => v.status?.privacyStatus === privacy)
  }

  return {
    videos,
    nextPageToken: searchData.nextPageToken,
    totalResults: searchData.pageInfo.totalResults,
  }
}

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo> {
  const headers = await getAuthHeader()
  const res = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails,status&id=${videoId}`,
    { headers }
  )

  if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`)
  const data = (await res.json()) as { items?: YouTubeVideo[] }

  if (!data.items?.length) throw new Error("Video not found.")

  return data.items[0]
}

export async function updateVideoMetadata(
  videoId: string,
  updates: { title?: string; description?: string; tags?: string[] }
): Promise<YouTubeVideo> {
  const video = await getVideoDetails(videoId)
  const headers = await getAuthHeader()

  const snippet: Record<string, unknown> = {
    title: updates.title ?? video.snippet.title,
    description: updates.description ?? video.snippet.description,
    categoryId: video.snippet.categoryId ?? "22",
    channelId: video.snippet.channelId,
  }
  if (updates.tags !== undefined) {
    snippet.tags = updates.tags
  }

  const res = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=snippet`,
    {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: videoId,
        snippet,
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to update video: ${res.statusText} ${text.slice(0, 120)}`)
  }

  const data = (await res.json()) as YouTubeVideo
  return data
}

export interface YouTubePlaylistSnippet {
  title: string
  description: string
}

export interface YouTubePlaylist {
  id: string
  snippet: YouTubePlaylistSnippet
}

export async function listMyPlaylists(
  maxResults = 25
): Promise<YouTubePlaylist[]> {
  const headers = await getAuthHeader()
  const res = await fetch(
    `${YOUTUBE_API_BASE}/playlists?part=snippet&mine=true&maxResults=${maxResults}`,
    { headers }
  )
  if (!res.ok) throw new Error(`Playlists failed: ${res.statusText}`)
  const data = (await res.json()) as { items?: YouTubePlaylist[] }
  return data.items ?? []
}

export async function insertPlaylistItem(
  playlistId: string,
  videoId: string
): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?part=snippet`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          playlistId,
          resourceId: { kind: "youtube#video", videoId },
        },
      }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Playlist insert failed: ${res.statusText} ${text.slice(0, 120)}`)
  }
}
