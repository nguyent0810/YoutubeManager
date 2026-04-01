import { prisma } from "@/lib/db"

/** Feature keys stored in OrgFeatureFlag and used by API / UI. */
export const ORG_FEATURE_EXPORTS = "exports"
export const ORG_FEATURE_YOUTUBE_WRITES = "youtube_writes"

export type OrgFeatureKey =
  | typeof ORG_FEATURE_EXPORTS
  | typeof ORG_FEATURE_YOUTUBE_WRITES

function envBool(name: string, defaultTrue: boolean): boolean {
  const v = process.env[name]
  if (v === undefined || v === "") return defaultTrue
  return v !== "false" && v !== "0"
}

/** Effective flag: DB row wins when present; otherwise deployment default. */
export async function isOrgFeatureEnabled(
  organizationId: string,
  key: OrgFeatureKey
): Promise<boolean> {
  const row = await prisma.orgFeatureFlag.findUnique({
    where: { organizationId_key: { organizationId, key } },
  })
  if (row) return row.enabled
  if (key === ORG_FEATURE_EXPORTS) {
    return envBool("FEATURE_EXPORTS_DEFAULT", true)
  }
  if (key === ORG_FEATURE_YOUTUBE_WRITES) {
    return envBool("FEATURE_YOUTUBE_WRITES_DEFAULT", true)
  }
  return true
}

export async function getOrgFeatureSnapshot(organizationId: string): Promise<{
  exports: boolean
  youtube_writes: boolean
}> {
  const [exportsEnabled, youtubeWrites] = await Promise.all([
    isOrgFeatureEnabled(organizationId, ORG_FEATURE_EXPORTS),
    isOrgFeatureEnabled(organizationId, ORG_FEATURE_YOUTUBE_WRITES),
  ])
  return { exports: exportsEnabled, youtube_writes: youtubeWrites }
}

export async function upsertOrgFeature(
  organizationId: string,
  key: OrgFeatureKey,
  enabled: boolean
) {
  await prisma.orgFeatureFlag.upsert({
    where: { organizationId_key: { organizationId, key } },
    create: { organizationId, key, enabled },
    update: { enabled },
  })
}
