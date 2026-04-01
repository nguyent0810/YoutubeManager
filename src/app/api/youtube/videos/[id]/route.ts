import { NextResponse } from "next/server"
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
      return NextResponse.json({ error: "Video id is required" }, { status: 400 })
    }
    const video = await getVideoDetails(id)
    return NextResponse.json(video)
  } catch (error: unknown) {
    console.error("Error fetching video:", error)
    const message = errorMessage(error)
    const status = message.includes("Unauthorized") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
