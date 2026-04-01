import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { dbUnavailable, requireOrgWrite } from "@/lib/api-org-context"

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(8000).optional(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401)
    }
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const { id } = await context.params
    if (!id) return jsonError("Missing id", 400)

    const json: unknown = await req.json()
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const existing = await prisma.savedReply.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) return jsonError("Not found", 404)

    const row = await prisma.savedReply.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.body !== undefined ? { body: parsed.data.body } : {}),
      },
    })
    return Response.json(row)
  } catch (error: unknown) {
    logApiError("PATCH /api/saved-replies/[id]", error)
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
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401)
    }
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const { id } = await context.params
    if (!id) return jsonError("Missing id", 400)

    const existing = await prisma.savedReply.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) return jsonError("Not found", 404)

    await prisma.savedReply.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (error: unknown) {
    logApiError("DELETE /api/saved-replies/[id]", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to delete",
      httpStatusFromError(error)
    )
  }
}
