import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import {
  dbUnavailable,
  requireOrgRead,
  requireOrgWrite,
} from "@/lib/api-org-context"

const createSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(8000),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401)
    }
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const rows = await prisma.savedReply.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { updatedAt: "desc" },
    })
    return Response.json({ replies: rows })
  } catch (error: unknown) {
    logApiError("GET /api/saved-replies", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to list",
      httpStatusFromError(error)
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401)
    }
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const json: unknown = await req.json()
    const parsed = createSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const row = await prisma.savedReply.create({
      data: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        title: parsed.data.title,
        body: parsed.data.body,
      },
    })
    return Response.json(row)
  } catch (error: unknown) {
    logApiError("POST /api/saved-replies", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to create",
      httpStatusFromError(error)
    )
  }
}
