import { jsonError, statusFromYouTubeError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { insertPlaylistItem } from "@/lib/youtube"
import { z } from "zod"

const bodySchema = z.object({
  playlistId: z.string().min(1),
  videoId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("playlistId and videoId required", 400)
    }
    await insertPlaylistItem(parsed.data.playlistId, parsed.data.videoId)
    return Response.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add to playlist"
    logApiError("POST /api/youtube/playlist-items", error)
    return jsonError(message, statusFromYouTubeError(message))
  }
}
