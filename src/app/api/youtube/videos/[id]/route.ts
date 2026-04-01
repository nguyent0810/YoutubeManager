import { NextResponse } from "next/server"
import { jsonError, statusFromYouTubeError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { getVideoDetails } from "@/lib/youtube"

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Failed to fetch video"
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) {
      return jsonError("Video id is required", 400)
    }
    const video = await getVideoDetails(id)
    return NextResponse.json(video)
  } catch (error: unknown) {
    const message = errorMessage(error)
    logApiError("GET /api/youtube/videos/[id]", error)
    return jsonError(message, statusFromYouTubeError(message))
  }
}
