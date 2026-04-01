import { z } from "zod"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import {
  dbUnavailable,
  requireAuthedUser,
} from "@/lib/api-org-context"
import { ACTIVE_ORG_COOKIE } from "@/lib/org"

const bodySchema = z.object({
  organizationId: z.string().min(1),
})

function cookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  }
}

export async function POST(req: Request) {
  try {
    const u = await requireAuthedUser()
    if (u instanceof Response) return u
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const json: unknown = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("organizationId required", 400, "validation_error")
    }

    const m = await prisma.organizationMember.findFirst({
      where: {
        userId: u.userId,
        organizationId: parsed.data.organizationId,
      },
    })
    if (!m) {
      return jsonError("Not a member of this organization", 403)
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(
      ACTIVE_ORG_COOKIE,
      parsed.data.organizationId,
      cookieOptions()
    )
    return res
  } catch (error: unknown) {
    logApiError("POST /api/orgs/active", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to set workspace",
      httpStatusFromError(error)
    )
  }
}
