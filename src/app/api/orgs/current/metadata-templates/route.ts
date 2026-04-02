import { z } from "zod"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireOrgRead, requireOrgWrite } from "@/lib/api-org-context"

const postSchema = z.object({
  name: z.string().min(1).max(120),
  title: z.string().max(5000).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  tags: z.string().max(500).optional().nullable(),
  categoryId: z.string().max(32).optional().nullable(),
  visibility: z
    .enum(["public", "private", "unlisted", "schedule"])
    .optional()
    .nullable(),
})

export async function GET() {
  try {
    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const list = await prisma.metadataTemplate.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { updatedAt: "desc" },
    })

    return Response.json({
      templates: list.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        description: t.description,
        tags: t.tags,
        categoryId: t.categoryId,
        visibility: t.visibility,
        updatedAt: t.updatedAt.toISOString(),
      })),
    })
  } catch (error: unknown) {
    logApiError("GET /api/orgs/current/metadata-templates", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to list templates",
      httpStatusFromError(error)
    )
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const json: unknown = await req.json()
    const parsed = postSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const t = await prisma.metadataTemplate.create({
      data: {
        organizationId: ctx.organizationId,
        name: parsed.data.name.trim(),
        title: parsed.data.title ?? null,
        description: parsed.data.description ?? null,
        tags: parsed.data.tags ?? null,
        categoryId: parsed.data.categoryId ?? null,
        visibility: parsed.data.visibility ?? null,
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
    logApiError("POST /api/orgs/current/metadata-templates", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to create template",
      httpStatusFromError(error)
    )
  }
}
