import { NextResponse, NextRequest } from "next/server"
import { getChannelVideos } from "@/lib/youtube"
import type { PrivacyStatus } from "@/types/youtube"

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Failed to fetch videos"
}

const PRIVACY: Array<PrivacyStatus | "all"> = [
  "all",
  "public",
  "private",
  "unlisted",
]

function parsePrivacy(value: string | null): PrivacyStatus | "all" {
  if (!value || !PRIVACY.includes(value as PrivacyStatus | "all")) return "all"
  return value as PrivacyStatus | "all"
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const channelId = searchParams.get("channelId")
    const pageToken = searchParams.get("pageToken") || undefined
    const maxResults = searchParams.get("maxResults")
      ? parseInt(searchParams.get("maxResults")!, 10)
      : 50
    const q = searchParams.get("q") || undefined
    const privacy = parsePrivacy(searchParams.get("privacy"))

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 }
      )
    }

    const data = await getChannelVideos(channelId, {
      pageToken,
      maxResults,
      q,
      privacy,
    })
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Error fetching videos:", error)
    const message = errorMessage(error)
    const status = message.includes("Unauthorized") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
