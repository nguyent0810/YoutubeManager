import { NextRequest } from "next/server"
import { jsonError, statusFromYouTubeError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { getVideoAnalytics } from "@/lib/youtube-analytics"
import { z } from "zod"

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return jsonError("Video id required", 400)

    const sp = req.nextUrl.searchParams
    const parsed = querySchema.safeParse({
      startDate: sp.get("startDate") ?? "",
      endDate: sp.get("endDate") ?? "",
    })
    if (!parsed.success) {
      return jsonError("startDate and endDate must be YYYY-MM-DD", 400)
    }

    const data = await getVideoAnalytics(
      id,
      parsed.data.startDate,
      parsed.data.endDate
    )
    return Response.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Analytics failed"
    logApiError("GET /api/youtube/analytics/videos/[id]", error)
    return jsonError(message, statusFromYouTubeError(message))
  }
}
