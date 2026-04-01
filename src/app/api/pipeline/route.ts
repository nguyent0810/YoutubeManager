import { z } from "zod"
import { PipelineStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { getSessionUserId } from "@/lib/session-user"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(20000).optional().default(""),
  status: z.nativeEnum(PipelineStatus).optional(),
  dueDate: z.string().optional().nullable(),
  youtubeVideoId: z.string().max(32).optional().nullable(),
})

function dbUnavailable() {
  return jsonError(
    "Database is not configured. Add DATABASE_URL and run migrations.",
    503,
    "db_unconfigured"
  )
}

function parseDueDate(
  s: string | null | undefined
): Date | null | undefined {
  if (s === undefined) return undefined
  if (s === null || s === "") return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonError("Unauthorized", 401)
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const userId = await getSessionUserId()
    if (!userId) return jsonError("Unauthorized", 401)

    const items = await prisma.pipelineItem.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    })
    return Response.json({ items })
  } catch (error: unknown) {
    logApiError("GET /api/pipeline", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to list",
      httpStatusFromError(error)
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonError("Unauthorized", 401)
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const userId = await getSessionUserId()
    if (!userId) return jsonError("Unauthorized", 401)

    const json: unknown = await req.json()
    const parsed = createSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const due = parseDueDate(parsed.data.dueDate ?? undefined)

    const row = await prisma.pipelineItem.create({
      data: {
        userId,
        title: parsed.data.title,
        notes: parsed.data.notes,
        status: parsed.data.status ?? PipelineStatus.BACKLOG,
        dueDate: due ?? undefined,
        youtubeVideoId: parsed.data.youtubeVideoId ?? undefined,
      },
    })
    return Response.json(row)
  } catch (error: unknown) {
    logApiError("POST /api/pipeline", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to create",
      httpStatusFromError(error)
    )
  }
}
