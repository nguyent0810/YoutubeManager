import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonError, httpStatusFromError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireYoutubeMutationAllowed } from "@/lib/api-org-context"
import { insertCommentReply } from "@/lib/youtube"

const bodySchema = z.object({
  parentId: z.string().min(1),
  textOriginal: z.string().min(1).max(10000),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonError("Unauthorized", 401)

    const gate = await requireYoutubeMutationAllowed()
    if (gate instanceof Response) return gate

    const json: unknown = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("parentId and textOriginal are required", 400)
    }
    await insertCommentReply(parsed.data.parentId, parsed.data.textOriginal)
    return Response.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to post reply"
    logApiError("POST /api/youtube/comments", error)
    return jsonError(message, httpStatusFromError(error))
  }
}
