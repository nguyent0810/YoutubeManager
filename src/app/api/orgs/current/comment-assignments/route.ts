import { z } from "zod"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireOrgRead, requireOrgWrite } from "@/lib/api-org-context"

const upsertSchema = z.object({
  videoId: z.string().min(1),
  threadId: z.string().min(1),
  assigneeUserId: z.string().min(1).nullable(),
})

export async function GET(req: Request) {
  try {
    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const url = new URL(req.url)
    const videoId = url.searchParams.get("videoId")
    if (!videoId?.trim()) {
      return jsonError("videoId query required", 400, "validation_error")
    }

    const rows = await prisma.commentThreadAssignment.findMany({
      where: {
        organizationId: ctx.organizationId,
        videoId: videoId.trim(),
      },
    })

    return Response.json({
      assignments: rows.map((r) => ({
        threadId: r.threadId,
        assigneeUserId: r.assigneeUserId,
      })),
    })
  } catch (error: unknown) {
    logApiError("GET /api/orgs/current/comment-assignments", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to load assignments",
      httpStatusFromError(error)
    )
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const json: unknown = await req.json()
    const parsed = upsertSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const { videoId, threadId, assigneeUserId } = parsed.data

    if (assigneeUserId === null) {
      await prisma.commentThreadAssignment.deleteMany({
        where: {
          organizationId: ctx.organizationId,
          videoId,
          threadId,
        },
      })
      return Response.json({ ok: true, threadId, assigneeUserId: null })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: ctx.organizationId,
        userId: assigneeUserId,
      },
    })
    if (!member) {
      return jsonError("Assignee is not a member of this workspace.", 400)
    }

    await prisma.commentThreadAssignment.upsert({
      where: {
        organizationId_threadId: {
          organizationId: ctx.organizationId,
          threadId,
        },
      },
      create: {
        organizationId: ctx.organizationId,
        videoId,
        threadId,
        assigneeUserId,
      },
      update: {
        videoId,
        assigneeUserId,
      },
    })

    return Response.json({ ok: true, threadId, assigneeUserId })
  } catch (error: unknown) {
    logApiError("POST /api/orgs/current/comment-assignments", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to save assignment",
      httpStatusFromError(error)
    )
  }
}
