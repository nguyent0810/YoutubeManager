import { NextRequest } from "next/server"
import { jsonError, httpStatusFromError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { listCommentThreads } from "@/lib/youtube"

export async function GET(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get("videoId")
    if (!videoId) {
      return jsonError("videoId is required", 400)
    }
    const pageToken =
      req.nextUrl.searchParams.get("pageToken") || undefined
    const data = await listCommentThreads(videoId, pageToken)
    return Response.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load comments"
    logApiError("GET /api/youtube/comment-threads", error)
    return jsonError(message, httpStatusFromError(error))
  }
}
