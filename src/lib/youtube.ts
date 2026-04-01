import { auth } from "@/lib/auth"
import type {
  YouTubeChannel,
  YouTubeSearchItem,
  YouTubeVideosResponse,
  YouTubeVideo,
  PrivacyStatus,
} from "@/types/youtube"

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
const YOUTUBE_UPLOAD_BASE =
  "https://www.googleapis.com/upload/youtube/v3/videos"

/** Thrown when the YouTube Data API returns a structured error; includes HTTP status for API routes. */
export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = "YouTubeApiError"
  }
}

export function youtubeErrorFromResponse(status: number, raw: string): never {
  let reason: string | undefined
  let apiMsg: string | undefined

  try {
    const j = JSON.parse(raw) as {
      error?: {
        message?: string
        errors?: Array<{ reason?: string; message?: string }>
      }
    }
    reason = j.error?.errors?.[0]?.reason
    apiMsg = j.error?.message
  } catch {
    // non-JSON body
  }

  if (reason === "accessNotConfigured") {
    throw new YouTubeApiError(
      "YouTube Data API v3 is not enabled. In Google Cloud Console → APIs & Services → Library, enable “YouTube Data API v3” for the project that owns your OAuth client ID.",
      403
    )
  }

  if (reason === "insufficientPermissions" || reason === "forbidden") {
    throw new YouTubeApiError(
      "YouTube denied access (insufficient permissions). Your saved login may be missing scopes for comments or uploads. Sign out, open https://myaccount.google.com/permissions , remove access for this app, then sign in again and accept every permission. If it persists, confirm the signed-in Google account owns the channel.",
      403
    )
  }

  if (reason === "youtubeSignupRequired") {
    throw new YouTubeApiError(
      "This Google account does not have a YouTube channel. Create one at https://www.youtube.com and try again.",
      400
    )
  }

  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
    throw new YouTubeApiError(
      "YouTube Data API quota exceeded. Try again later or request a quota increase in Google Cloud Console.",
      429
    )
  }

  if (apiMsg) {
    throw new YouTubeApiError(
      `YouTube API: ${apiMsg}${reason ? ` (${reason})` : ""}`,
      status >= 400 && status < 600 ? status : 500
    )
  }

  throw new YouTubeApiError(
    `YouTube API request failed (${status}): ${raw.slice(0, 280) || "Unknown error"}`,
    status >= 400 && status < 600 ? status : 500
  )
}

async function parseYouTubeResponse<T>(res: Response): Promise<T> {
  const raw = await res.text()
  if (!res.ok) youtubeErrorFromResponse(res.status, raw)
  if (!raw.trim()) return {} as T
  return JSON.parse(raw) as T
}

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

  const data = await parseYouTubeResponse<{
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
  }>(res)
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
  const searchData = await parseYouTubeResponse<{
    items?: YouTubeSearchItem[]
    nextPageToken?: string
    pageInfo: { totalResults: number }
  }>(searchRes)

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
  const videoData = await parseYouTubeResponse<{ items: YouTubeVideo[] }>(
    videoRes
  )

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

  const data = await parseYouTubeResponse<{ items?: YouTubeVideo[] }>(res)

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

  return parseYouTubeResponse<YouTubeVideo>(res)
}

export interface ResumableVideoUploadInit {
  title: string
  description?: string
  tags?: string[]
  categoryId?: string
  /** Scheduled public release requires `private` + `publishAt` (YouTube API rules). */
  privacyStatus: PrivacyStatus
  /** RFC 3339 / ISO-8601; only when scheduling; forces private. */
  publishAt?: string | null
  selfDeclaredMadeForKids: boolean
  contentLength: number
  contentType: string
}

/**
 * Start a resumable upload; returns the `Location` URL for chunked `PUT` requests.
 * @see https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
 */
export async function createResumableVideoUploadSession(
  opts: ResumableVideoUploadInit
): Promise<string> {
  const headers = await getAuthHeader()

  const status: Record<string, unknown> = {
    privacyStatus: opts.privacyStatus,
    selfDeclaredMadeForKids: opts.selfDeclaredMadeForKids,
  }
  if (opts.publishAt) {
    status.publishAt = opts.publishAt
  }

  const snippet: Record<string, unknown> = {
    title: opts.title,
    description: opts.description ?? "",
    categoryId: opts.categoryId ?? "22",
  }
  if (opts.tags?.length) {
    snippet.tags = opts.tags.slice(0, 30)
  }

  const initRes = await fetch(
    `${YOUTUBE_UPLOAD_BASE}?uploadType=resumable&part=snippet,status`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(opts.contentLength),
        "X-Upload-Content-Type": opts.contentType,
      },
      body: JSON.stringify({ snippet, status }),
    }
  )

  if (!initRes.ok) {
    const raw = await initRes.text()
    youtubeErrorFromResponse(initRes.status, raw)
  }

  const location = initRes.headers.get("Location")
  if (!location) {
    throw new YouTubeApiError(
      "YouTube did not return a resumable upload URL (missing Location).",
      502
    )
  }
  return location
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
  const data = await parseYouTubeResponse<{ items?: YouTubePlaylist[] }>(res)
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
  await parseYouTubeResponse<unknown>(res)
}

/** Top-level comment in a thread (YouTube Data API shape, subset). */
export interface YouTubeCommentSnippet {
  authorDisplayName: string
  textDisplay: string
  publishedAt: string
  updatedAt: string
}

export interface YouTubeCommentResource {
  id: string
  snippet: YouTubeCommentSnippet
}

export interface YouTubeCommentThreadItem {
  id: string
  snippet: {
    topLevelComment: YouTubeCommentResource
    totalReplyCount: number
    canReply?: boolean
  }
  replies?: {
    comments?: YouTubeCommentResource[]
  }
}

export interface CommentThreadsListResult {
  items?: YouTubeCommentThreadItem[]
  nextPageToken?: string
  pageInfo?: { totalResults: number }
}

export async function listCommentThreads(
  videoId: string,
  pageToken?: string
): Promise<CommentThreadsListResult> {
  const headers = await getAuthHeader()
  const params = new URLSearchParams({
    part: "snippet,replies",
    videoId,
    maxResults: "100",
  })
  if (pageToken) params.set("pageToken", pageToken)
  const res = await fetch(
    `${YOUTUBE_API_BASE}/commentThreads?${params}`,
    { headers }
  )
  return parseYouTubeResponse<CommentThreadsListResult>(res)
}

export async function insertCommentReply(
  parentId: string,
  textOriginal: string
): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        parentId,
        textOriginal,
      },
    }),
  })
  await parseYouTubeResponse<unknown>(res)
}
