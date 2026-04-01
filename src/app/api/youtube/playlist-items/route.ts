import { z } from "zod"
import { auth } from "@/lib/auth"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireYoutubeMutationAllowed } from "@/lib/api-org-context"
import { insertPlaylistItem } from "@/lib/youtube"

const bodySchema = z.object({
  playlistId: z.string().min(1),
  videoId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonError("Unauthorized", 401)

    const gate = await requireYoutubeMutationAllowed()
    if (gate instanceof Response) return gate

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
    return jsonError(message, httpStatusFromError(error))
  }
}
