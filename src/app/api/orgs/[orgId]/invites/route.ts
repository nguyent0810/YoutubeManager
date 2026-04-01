import { randomBytes } from "node:crypto"
import { z } from "zod"
import type { OrgRole } from "@prisma/client"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireAuthedAdminOfOrg } from "@/lib/api-org-context"

const postSchema = z.object({
  email: z.string().email(),
  role: z.enum(["VIEWER", "MEMBER", "ADMIN"]).optional().default("MEMBER"),
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params
    if (!orgId) return jsonError("Missing organization id", 400)

    const base = await requireAuthedAdminOfOrg(orgId)
    if (base instanceof Response) return base

    const invites = await prisma.organizationInvite.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    })

    return Response.json({
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expiresAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      })),
    })
  } catch (error: unknown) {
    logApiError("GET /api/orgs/[orgId]/invites", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to list invites",
      httpStatusFromError(error)
    )
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params
    if (!orgId) return jsonError("Missing organization id", 400)

    const base = await requireAuthedAdminOfOrg(orgId)
    if (base instanceof Response) return base

    const json: unknown = await req.json()
    const parsed = postSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const email = normalizeEmail(parsed.data.email)

    const dup = await prisma.organizationInvite.findFirst({
      where: { organizationId: orgId, email },
    })
    if (dup) {
      await prisma.organizationInvite.delete({ where: { id: dup.id } })
    }

    const token = randomBytes(24).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId: orgId,
        email,
        role: parsed.data.role as OrgRole,
        token,
        expiresAt,
      },
    })

    return Response.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
    })
  } catch (error: unknown) {
    logApiError("POST /api/orgs/[orgId]/invites", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to create invite",
      httpStatusFromError(error)
    )
  }
}
