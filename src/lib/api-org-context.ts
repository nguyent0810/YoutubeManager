import { auth } from "@/lib/auth"
import { jsonError } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import {
  ensurePersonalOrganization,
  getActiveOrganizationId,
  requireOrgMember,
  requireOrgMinRole,
} from "@/lib/org"
import {
  isOrgFeatureEnabled,
  ORG_FEATURE_YOUTUBE_WRITES,
} from "@/lib/features"
import { getSessionUserId } from "@/lib/session-user"

export function dbUnavailable() {
  return jsonError(
    "Database is not configured. Add DATABASE_URL and run migrations.",
    503,
    "db_unconfigured"
  )
}

export type AuthedUser = { userId: string; email: string | null }

export async function requireAuthedUser(): Promise<AuthedUser | Response> {
  const session = await auth()
  if (!session?.user?.id) return jsonError("Unauthorized", 401)
  const userId = await getSessionUserId()
  if (!userId) return jsonError("Unauthorized", 401)
  return { userId, email: session.user.email ?? null }
}

export async function requireOrgRead(): Promise<
  { userId: string; organizationId: string } | Response
> {
  const u = await requireAuthedUser()
  if (u instanceof Response) return u
  if (!process.env.DATABASE_URL) return dbUnavailable()
  const organizationId = await getActiveOrganizationId(u.userId, u.email)
  const r = await requireOrgMember(organizationId, u.userId)
  if (!r.ok) return jsonError(r.message, r.status)
  return { userId: u.userId, organizationId }
}

export async function requireOrgWrite(): Promise<
  { userId: string; organizationId: string } | Response
> {
  const u = await requireAuthedUser()
  if (u instanceof Response) return u
  if (!process.env.DATABASE_URL) return dbUnavailable()
  const organizationId = await getActiveOrganizationId(u.userId, u.email)
  const r = await requireOrgMinRole(organizationId, u.userId, "MEMBER")
  if (!r.ok) return jsonError(r.message, r.status)
  return { userId: u.userId, organizationId }
}

export async function requireOrgAdmin(): Promise<
  { userId: string; organizationId: string } | Response
> {
  const u = await requireAuthedUser()
  if (u instanceof Response) return u
  if (!process.env.DATABASE_URL) return dbUnavailable()
  const organizationId = await getActiveOrganizationId(u.userId, u.email)
  const r = await requireOrgMinRole(organizationId, u.userId, "ADMIN")
  if (!r.ok) return jsonError(r.message, r.status)
  return { userId: u.userId, organizationId }
}

export async function requireOrgOwner(): Promise<
  { userId: string; organizationId: string } | Response
> {
  const u = await requireAuthedUser()
  if (u instanceof Response) return u
  if (!process.env.DATABASE_URL) return dbUnavailable()
  const organizationId = await getActiveOrganizationId(u.userId, u.email)
  const r = await requireOrgMinRole(organizationId, u.userId, "OWNER")
  if (!r.ok) return jsonError(r.message, r.status)
  return { userId: u.userId, organizationId }
}

export type AuthedOrgMember = AuthedUser & { organizationId: string }

/** Membership in the organization given by URL param (not necessarily the active cookie org). */
export async function requireAuthedMemberOfOrg(
  orgIdFromUrl: string
): Promise<AuthedOrgMember | Response> {
  const u = await requireAuthedUser()
  if (u instanceof Response) return u
  if (!process.env.DATABASE_URL) return dbUnavailable()
  await ensurePersonalOrganization(u.userId, u.email)
  const m = await prisma.organizationMember.findFirst({
    where: { userId: u.userId, organizationId: orgIdFromUrl },
  })
  if (!m) return jsonError("Not a member of this organization", 403)
  return { ...u, organizationId: orgIdFromUrl }
}

export async function requireAuthedAdminOfOrg(
  orgIdFromUrl: string
): Promise<AuthedOrgMember | Response> {
  const base = await requireAuthedMemberOfOrg(orgIdFromUrl)
  if (base instanceof Response) return base
  const r = await requireOrgMinRole(orgIdFromUrl, base.userId, "ADMIN")
  if (!r.ok) return jsonError(r.message, r.status)
  return base
}

export async function requireAuthedOwnerOfOrg(
  orgIdFromUrl: string
): Promise<AuthedOrgMember | Response> {
  const base = await requireAuthedMemberOfOrg(orgIdFromUrl)
  if (base instanceof Response) return base
  const r = await requireOrgMinRole(orgIdFromUrl, base.userId, "OWNER")
  if (!r.ok) return jsonError(r.message, r.status)
  return base
}

export async function requireYoutubeMutationAllowed(): Promise<
  { userId: string; organizationId: string } | Response
> {
  const w = await requireOrgWrite()
  if (w instanceof Response) return w
  const allowed = await isOrgFeatureEnabled(
    w.organizationId,
    ORG_FEATURE_YOUTUBE_WRITES
  )
  if (!allowed) {
    return jsonError(
      "YouTube write actions are disabled for this workspace.",
      403,
      "feature_disabled"
    )
  }
  return w
}
