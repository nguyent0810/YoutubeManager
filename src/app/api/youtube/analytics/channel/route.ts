import { NextRequest } from "next/server"
import { jsonError, statusFromYouTubeError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { getChannelDailyAnalytics } from "@/lib/youtube-analytics"
import { z } from "zod"

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const parsed = querySchema.safeParse({
      startDate: sp.get("startDate") ?? "",
      endDate: sp.get("endDate") ?? "",
    })
    if (!parsed.success) {
      return jsonError("startDate and endDate must be YYYY-MM-DD", 400)
    }
    const { startDate, endDate } = parsed.data
    const data = await getChannelDailyAnalytics(startDate, endDate)
    return Response.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Analytics failed"
    logApiError("GET /api/youtube/analytics/channel", error)
    return jsonError(message, statusFromYouTubeError(message))
  }
}
