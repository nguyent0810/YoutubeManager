/** Client-safe role ordering (mirrors server `OrgRole`). */
const RANK = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
} as const

export type OrgRoleValue = keyof typeof RANK

export function orgRoleAtLeast(
  role: string | null | undefined,
  min: OrgRoleValue
): boolean {
  if (!role || !(role in RANK)) return false
  return RANK[role as OrgRoleValue] >= RANK[min]
}
