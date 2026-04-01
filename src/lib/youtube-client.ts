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
