import type { YouTubeVideo } from "@/types/youtube"

export async function fetchVideoById(id: string): Promise<YouTubeVideo> {
  const res = await fetch(`/api/youtube/videos/${id}`)
  const data = (await res.json()) as { error?: string } & YouTubeVideo
  if (!res.ok) throw new Error(data.error || "Failed to load video")
  return data
}

export interface PlaylistOption {
  id: string
  title: string
}

export async function fetchMyPlaylists(): Promise<PlaylistOption[]> {
  const res = await fetch("/api/youtube/playlists")
  const data = (await res.json()) as {
    error?: string
    playlists?: { id: string; snippet: { title: string } }[]
  }
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load playlists"
    )
  }
  return (data.playlists ?? []).map((p) => ({
    id: p.id,
    title: p.snippet.title,
  }))
}

export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string
): Promise<void> {
  const res = await fetch("/api/youtube/playlist-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playlistId, videoId }),
  })
  const data = (await res.json()) as { error?: string }
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to add to playlist"
    )
  }
}

export interface YoutubeUploadInitPayload {
  title: string
  description?: string
  tags?: string[]
  categoryId?: string
  privacyStatus: "public" | "private" | "unlisted"
  publishAt?: string | null
  selfDeclaredMadeForKids: boolean
  contentLength: number
  contentType: string
}

export async function initYoutubeResumableUpload(
  body: YoutubeUploadInitPayload
): Promise<{ sessionToken: string; contentLength: number }> {
  const res = await fetch("/api/youtube/upload/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Upload init failed"
    throw new Error(msg)
  }
  return data as { sessionToken: string; contentLength: number }
}

export async function uploadYoutubeVideoChunk(
  sessionToken: string,
  chunk: ArrayBuffer,
  contentRange: string
): Promise<{
  done: boolean
  video?: { id?: string }
  range?: string | null
}> {
  const res = await fetch("/api/youtube/upload/chunk", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Range": contentRange,
    },
    body: chunk,
  })
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Upload chunk failed"
    throw new Error(msg)
  }
  return data as {
    done: boolean
    video?: { id?: string }
    range?: string | null
  }
}

const UPLOAD_CHUNK_BYTES = 2 * 1024 * 1024

export async function uploadLocalFileToYoutube(
  file: File,
  metadata: Omit<YoutubeUploadInitPayload, "contentLength" | "contentType">,
  onProgress?: (percent: number) => void
): Promise<{ id: string }> {
  if (file.size <= 0) throw new Error("File is empty.")
  const contentType = file.type?.trim() || "application/octet-stream"
  const { sessionToken, contentLength } = await initYoutubeResumableUpload({
    ...metadata,
    contentLength: file.size,
    contentType,
  })
  if (contentLength !== file.size) {
    throw new Error("Upload session size mismatch.")
  }

  let start = 0
  while (start < file.size) {
    const end = Math.min(start + UPLOAD_CHUNK_BYTES, file.size) - 1
    const slice = file.slice(start, end + 1)
    const buf = await slice.arrayBuffer()
    const range = `bytes ${start}-${end}/${file.size}`
    const result = await uploadYoutubeVideoChunk(sessionToken, buf, range)
    onProgress?.(Math.min(100, Math.round(((end + 1) / file.size) * 100)))
    if (result.done) {
      const id = result.video?.id
      if (!id) throw new Error("Upload finished but YouTube returned no video id.")
      onProgress?.(100)
      return { id }
    }
    start = end + 1
  }

  throw new Error("Upload ended without a completion response from YouTube.")
}

export async function patchVideoMetadata(
  videoId: string,
  body: { title?: string; description?: string; tags?: string[] }
): Promise<YouTubeVideo> {
  const res = await fetch(`/api/youtube/videos/${videoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { error?: string } & YouTubeVideo
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to update video"
    )
  }
  return data
}
