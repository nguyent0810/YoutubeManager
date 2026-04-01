import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { listMyPlaylists } from "@/lib/youtube"

export async function GET() {
  try {
    const playlists = await listMyPlaylists(50)
    return Response.json({ playlists })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list playlists"
    logApiError("GET /api/youtube/playlists", error)
    return jsonError(message, httpStatusFromError(error))
  }
}
