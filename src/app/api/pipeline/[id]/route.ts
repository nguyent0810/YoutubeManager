import { z } from "zod"
import { PipelineStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { dbUnavailable, requireOrgWrite } from "@/lib/api-org-context"

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(20000).optional(),
  status: z.nativeEnum(PipelineStatus).optional(),
  dueDate: z.string().nullable().optional(),
  youtubeVideoId: z.string().max(32).nullable().optional(),
})

function parseDueDate(
  s: string | null | undefined
): Date | null | undefined {
  if (s === undefined) return undefined
  if (s === null || s === "") return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonError("Unauthorized", 401)
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const { id } = await context.params
    if (!id) return jsonError("Missing id", 400)

    const existing = await prisma.pipelineItem.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) return jsonError("Not found", 404)

    const json: unknown = await req.json()
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const data: {
      title?: string
      notes?: string
      status?: PipelineStatus
      dueDate?: Date | null
      youtubeVideoId?: string | null
    } = {}

    if (parsed.data.title !== undefined) data.title = parsed.data.title
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
    if (parsed.data.status !== undefined) data.status = parsed.data.status
    if (parsed.data.dueDate !== undefined) {
      data.dueDate = parseDueDate(parsed.data.dueDate)
    }
    if (parsed.data.youtubeVideoId !== undefined) {
      data.youtubeVideoId = parsed.data.youtubeVideoId
    }

    const row = await prisma.pipelineItem.update({
      where: { id },
      data,
    })
    return Response.json(row)
  } catch (error: unknown) {
    logApiError("PATCH /api/pipeline/[id]", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to update",
      httpStatusFromError(error)
    )
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonError("Unauthorized", 401)
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const { id } = await context.params
    if (!id) return jsonError("Missing id", 400)

    const existing = await prisma.pipelineItem.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) return jsonError("Not found", 404)

    await prisma.pipelineItem.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (error: unknown) {
    logApiError("DELETE /api/pipeline/[id]", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to delete",
      httpStatusFromError(error)
    )
  }
}
