import { NextResponse } from "next/server"
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
    console.error("Error fetching channel:", error)
    const message = errorMessage(error)
    const status = message.includes("Unauthorized") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
