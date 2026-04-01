import { z } from "zod"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import {
  dbUnavailable,
  requireAuthedUser,
} from "@/lib/api-org-context"

const bodySchema = z.object({
  token: z.string().min(1),
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function POST(req: Request) {
  try {
    const u = await requireAuthedUser()
    if (u instanceof Response) return u
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const sessionEmail = u.email ? normalizeEmail(u.email) : null
    if (!sessionEmail) {
      return jsonError("Your account has no email; cannot accept invite", 400)
    }

    const json: unknown = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("token is required", 400, "validation_error")
    }

    const invite = await prisma.organizationInvite.findUnique({
      where: { token: parsed.data.token },
      include: { organization: true },
    })
    if (!invite) return jsonError("Invalid or expired invite", 404)
    if (invite.expiresAt.getTime() < Date.now()) {
      await prisma.organizationInvite.delete({ where: { id: invite.id } })
      return jsonError("Invite has expired", 410)
    }

    if (normalizeEmail(invite.email) !== sessionEmail) {
      return jsonError("This invite was sent to a different email address", 403)
    }

    const already = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId: u.userId,
        },
      },
    })
    if (already) {
      await prisma.organizationInvite.delete({ where: { id: invite.id } })
      return Response.json({
        ok: true,
        organizationId: invite.organizationId,
        alreadyMember: true,
      })
    }

    await prisma.$transaction([
      prisma.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId: u.userId,
          role: invite.role,
        },
      }),
      prisma.organizationInvite.delete({ where: { id: invite.id } }),
    ])

    return Response.json({
      ok: true,
      organizationId: invite.organizationId,
      organizationName: invite.organization.name,
      alreadyMember: false,
    })
  } catch (error: unknown) {
    logApiError("POST /api/orgs/invites/accept", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to accept invite",
      httpStatusFromError(error)
    )
  }
}
