import { NextResponse } from "next/server"
import { jsonError, statusFromYouTubeError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { getMyChannel } from "@/lib/youtube"

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Failed to fetch channel"
}

export async function GET() {
  try {
    const channel = await getMyChannel()
    return NextResponse.json(channel)
  } catch (error: unknown) {
    const message = errorMessage(error)
    logApiError("GET /api/youtube/channel", error)
    return jsonError(message, statusFromYouTubeError(message))
  }
}
