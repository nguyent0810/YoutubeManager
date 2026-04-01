import { NextResponse, NextRequest } from "next/server"
import { jsonError, statusFromYouTubeError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { listVideosQuerySchema } from "@/lib/youtube-api-query"
import { getChannelVideos } from "@/lib/youtube"

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Failed to fetch videos"
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const parsed = listVideosQuerySchema.safeParse({
      channelId: sp.get("channelId") ?? "",
      pageToken: sp.get("pageToken") || undefined,
      maxResults: sp.get("maxResults") ?? undefined,
      q: sp.get("q") || undefined,
      privacy: sp.get("privacy") || undefined,
      order: sp.get("order") || undefined,
    })

    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
      return jsonError(
        `Invalid query: ${JSON.stringify(msg)}`,
        400,
        "validation_error"
      )
    }

    const { channelId, pageToken, maxResults, q, privacy, order } = parsed.data

    const data = await getChannelVideos(channelId, {
      pageToken,
      maxResults,
      q,
      privacy,
      order,
    })
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = errorMessage(error)
    logApiError("GET /api/youtube/videos", error)
    return jsonError(message, statusFromYouTubeError(message))
  }
}
