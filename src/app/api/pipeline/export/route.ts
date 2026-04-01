import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { dbUnavailable, requireOrgRead } from "@/lib/api-org-context"
import {
  isOrgFeatureEnabled,
  ORG_FEATURE_EXPORTS,
} from "@/lib/features"

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonError("Unauthorized", 401)
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const exportsOn = await isOrgFeatureEnabled(
      ctx.organizationId,
      ORG_FEATURE_EXPORTS
    )
    if (!exportsOn) {
      return jsonError(
        "Pipeline export is disabled for this workspace.",
        403,
        "feature_disabled"
      )
    }

    const items = await prisma.pipelineItem.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    })

    const header = [
      "id",
      "title",
      "notes",
      "status",
      "dueDate",
      "youtubeVideoId",
      "userId",
      "createdAt",
      "updatedAt",
    ]
    const lines = [
      header.join(","),
      ...items.map((it) =>
        [
          escapeCsvCell(it.id),
          escapeCsvCell(it.title),
          escapeCsvCell(it.notes),
          escapeCsvCell(it.status),
          escapeCsvCell(it.dueDate ? it.dueDate.toISOString() : ""),
          escapeCsvCell(it.youtubeVideoId ?? ""),
          escapeCsvCell(it.userId),
          escapeCsvCell(it.createdAt.toISOString()),
          escapeCsvCell(it.updatedAt.toISOString()),
        ].join(",")
      ),
    ]

    const csv = `${lines.join("\r\n")}\r\n`
    const filename = `pipeline-export-${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    logApiError("GET /api/pipeline/export", error)
    return jsonError(
      error instanceof Error ? error.message : "Export failed",
      httpStatusFromError(error)
    )
  }
}
