import { z } from "zod"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireOrgWrite } from "@/lib/api-org-context"

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  title: z.string().max(5000).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  tags: z.string().max(500).optional().nullable(),
  categoryId: z.string().max(32).optional().nullable(),
  visibility: z
    .enum(["public", "private", "unlisted", "schedule"])
    .optional()
    .nullable(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const { id } = await context.params
    if (!id) return jsonError("Missing id", 400)

    const json: unknown = await req.json()
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const existing = await prisma.metadataTemplate.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) return jsonError("Not found", 404)

    const t = await prisma.metadataTemplate.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description }
          : {}),
        ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
        ...(parsed.data.categoryId !== undefined
          ? { categoryId: parsed.data.categoryId }
          : {}),
        ...(parsed.data.visibility !== undefined
          ? { visibility: parsed.data.visibility }
          : {}),
      },
    })

    return Response.json({
      id: t.id,
      name: t.name,
      title: t.title,
      description: t.description,
      tags: t.tags,
      categoryId: t.categoryId,
      visibility: t.visibility,
      updatedAt: t.updatedAt.toISOString(),
    })
  } catch (error: unknown) {
    logApiError("PATCH /api/orgs/current/metadata-templates/[id]", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to update template",
      httpStatusFromError(error)
    )
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const { id } = await context.params
    if (!id) return jsonError("Missing id", 400)

    const existing = await prisma.metadataTemplate.findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    if (!existing) return jsonError("Not found", 404)

    await prisma.metadataTemplate.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (error: unknown) {
    logApiError("DELETE /api/orgs/current/metadata-templates/[id]", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to delete template",
      httpStatusFromError(error)
    )
  }
}
