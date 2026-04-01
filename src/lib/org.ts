import { cookies } from "next/headers"
import type { OrgRole } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getSessionUserEmail, getSessionUserId } from "@/lib/session-user"

export const ACTIVE_ORG_COOKIE = "ytm_active_org"

const ROLE_RANK: Record<OrgRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
}

export function orgRoleAtLeast(role: OrgRole, min: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min]
}

/** First membership (oldest) or create a personal org and backfill SavedReply / PipelineItem. */
export async function ensurePersonalOrganization(
  userId: string,
  email: string | null
): Promise<string> {
  const existing = await prisma.organizationMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })
  if (existing) {
    await backfillOrgScopedRows(userId, existing.organizationId)
    return existing.organizationId
  }

  const name = email
    ? `${email.split("@")[0] ?? "My"}'s workspace`
    : "Personal workspace"
  const org = await prisma.organization.create({
    data: {
      name,
      members: { create: { userId, role: "OWNER" } },
    },
  })
  await backfillOrgScopedRows(userId, org.id)
  return org.id
}

async function backfillOrgScopedRows(userId: string, organizationId: string) {
  await prisma.savedReply.updateMany({
    where: { userId, organizationId: null },
    data: { organizationId },
  })
  await prisma.pipelineItem.updateMany({
    where: { userId, organizationId: null },
    data: { organizationId },
  })
}

export async function getActiveOrganizationId(
  userId: string,
  email: string | null
): Promise<string> {
  const fallbackOrgId = await ensurePersonalOrganization(userId, email)
  const jar = await cookies()
  const fromCookie = jar.get(ACTIVE_ORG_COOKIE)?.value
  if (fromCookie) {
    const m = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: fromCookie },
    })
    if (m) return fromCookie
  }
  return fallbackOrgId
}

export async function getOrgMembership(organizationId: string, userId: string) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  })
}

export async function requireOrgMember(
  organizationId: string,
  userId: string
): Promise<
  | { ok: true; role: OrgRole }
  | { ok: false; status: 403; message: string }
> {
  const m = await getOrgMembership(organizationId, userId)
  if (!m) {
    return { ok: false, status: 403, message: "Not a member of this organization" }
  }
  return { ok: true, role: m.role }
}

export async function requireOrgMinRole(
  organizationId: string,
  userId: string,
  min: OrgRole
): Promise<
  | { ok: true; role: OrgRole }
  | { ok: false; status: 403; message: string }
> {
  const m = await requireOrgMember(organizationId, userId)
  if (!m.ok) return m
  if (!orgRoleAtLeast(m.role, min)) {
    return { ok: false, status: 403, message: "Insufficient role for this action" }
  }
  return { ok: true, role: m.role }
}

/** Resolve active org using session email (call from authenticated API routes). */
export async function resolveActiveOrganizationId(): Promise<string | null> {
  const userId = await getSessionUserId()
  if (!userId) return null
  const email = await getSessionUserEmail()
  return getActiveOrganizationId(userId, email)
}
