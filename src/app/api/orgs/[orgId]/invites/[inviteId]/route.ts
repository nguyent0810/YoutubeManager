import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireAuthedAdminOfOrg } from "@/lib/api-org-context"
import { writeAuditLog } from "@/lib/audit-log"

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ orgId: string; inviteId: string }> }
) {
  try {
    const { orgId, inviteId } = await context.params
    if (!orgId || !inviteId) {
      return jsonError("Missing organization or invite id", 400)
    }

    const base = await requireAuthedAdminOfOrg(orgId)
    if (base instanceof Response) return base

    const invite = await prisma.organizationInvite.findFirst({
      where: { id: inviteId, organizationId: orgId },
    })
    if (!invite) return jsonError("Invite not found", 404)

    await writeAuditLog({
      organizationId: orgId,
      userId: base.userId,
      action: "invite_revoked",
      entity: "OrganizationInvite",
      metadata: { inviteId, email: invite.email },
    })

    await prisma.organizationInvite.delete({ where: { id: inviteId } })
    return Response.json({ ok: true })
  } catch (error: unknown) {
    logApiError("DELETE /api/orgs/[orgId]/invites/[inviteId]", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to revoke invite",
      httpStatusFromError(error)
    )
  }
}
