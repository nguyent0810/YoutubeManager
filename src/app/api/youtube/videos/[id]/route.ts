import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireYoutubeMutationAllowed } from "@/lib/api-org-context"
import { getVideoDetails, updateVideoMetadata } from "@/lib/youtube"

const patchBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

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
    return jsonError(message, httpStatusFromError(error))
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonError("Unauthorized", 401)

    const gate = await requireYoutubeMutationAllowed()
    if (gate instanceof Response) return gate

    const { id } = await context.params
    if (!id) return jsonError("Video id is required", 400)

    const body: unknown = await req.json()
    const parsed = patchBodySchema.safeParse(body)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const video = await updateVideoMetadata(id, parsed.data)
    return NextResponse.json(video)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Update failed"
    logApiError("PATCH /api/youtube/videos/[id]", error)
    return jsonError(message, httpStatusFromError(error))
  }
}
