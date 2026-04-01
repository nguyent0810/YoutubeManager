import { z } from "zod"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireYoutubeMutationAllowed } from "@/lib/api-org-context"
import { createResumableVideoUploadSession } from "@/lib/youtube"
import { createUploadSessionToken } from "@/lib/upload-session-token"

export const maxDuration = 60

const initSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional().default(""),
  tags: z.array(z.string().max(30)).max(30).optional(),
  categoryId: z.string().optional().default("22"),
  privacyStatus: z.enum(["public", "private", "unlisted"]),
  publishAt: z.string().optional().nullable(),
  selfDeclaredMadeForKids: z.boolean(),
  contentLength: z
    .number()
    .int()
    .min(1)
    .max(20 * 1024 * 1024 * 1024),
  contentType: z.string().min(4).max(120),
})

export async function POST(req: Request) {
  try {
    const gate = await requireYoutubeMutationAllowed()
    if (gate instanceof Response) return gate

    const json: unknown = await req.json()
    const parsed = initSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const ct = parsed.data.contentType.toLowerCase()
    if (!ct.startsWith("video/") && ct !== "application/octet-stream") {
      return jsonError(
        "contentType must be video/* or application/octet-stream",
        400,
        "validation_error"
      )
    }

    let privacyStatus = parsed.data.privacyStatus
    let publishAt: string | undefined =
      parsed.data.publishAt?.trim() || undefined

    if (publishAt) {
      const when = new Date(publishAt)
      if (Number.isNaN(when.getTime())) {
        return jsonError("publishAt is not a valid date", 400)
      }
      if (when.getTime() < Date.now() + 60_000) {
        return jsonError(
          "publishAt must be at least one minute in the future.",
          400
        )
      }
      privacyStatus = "private"
    } else {
      publishAt = undefined
    }

    const uploadUrl = await createResumableVideoUploadSession({
      title: parsed.data.title,
      description: parsed.data.description,
      tags: parsed.data.tags,
      categoryId: parsed.data.categoryId,
      privacyStatus,
      publishAt: publishAt ?? null,
      selfDeclaredMadeForKids: parsed.data.selfDeclaredMadeForKids,
      contentLength: parsed.data.contentLength,
      contentType: parsed.data.contentType,
    })

    const sessionToken = createUploadSessionToken(uploadUrl, 3 * 60 * 60 * 1000)

    return Response.json({
      sessionToken,
      contentLength: parsed.data.contentLength,
    })
  } catch (error: unknown) {
    logApiError("POST /api/youtube/upload/init", error)
    return jsonError(
      error instanceof Error ? error.message : "Upload init failed",
      httpStatusFromError(error)
    )
  }
}
