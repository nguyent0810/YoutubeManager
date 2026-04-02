import { jsonError } from "@/lib/api-response"
import { isAiFullyEnabled } from "@/lib/ai-policy"
import { prisma } from "@/lib/db"
import { isOrgFeatureEnabled, ORG_FEATURE_AI } from "@/lib/features"

export { isAiFullyEnabled } from "@/lib/ai-policy"

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export async function getMemberAiOptIn(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const m = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { aiOptIn: true },
  })
  return m?.aiOptIn ?? false
}

export async function getAiStatusForUser(
  organizationId: string,
  userId: string
): Promise<{
  configured: boolean
  orgEnabled: boolean
  userOptIn: boolean
  allowed: boolean
}> {
  const configured = isGeminiConfigured()
  const orgEnabled = await isOrgFeatureEnabled(organizationId, ORG_FEATURE_AI)
  const userOptIn = await getMemberAiOptIn(organizationId, userId)
  return {
    configured,
    orgEnabled,
    userOptIn,
    allowed: isAiFullyEnabled({ configured, orgEnabled, userOptIn }),
  }
}

/** Returns a JSON Response when blocked, or `null` when the caller may invoke Gemini. */
export async function assertAiAllowed(
  organizationId: string,
  userId: string
): Promise<Response | null> {
  if (!isGeminiConfigured()) {
    return jsonError(
      "AI is not configured on this server (missing API key).",
      503,
      "ai_unconfigured"
    )
  }
  const orgEnabled = await isOrgFeatureEnabled(organizationId, ORG_FEATURE_AI)
  if (!orgEnabled) {
    return jsonError(
      "AI-assisted features are disabled for this workspace.",
      403,
      "ai_disabled"
    )
  }
  const userOptIn = await getMemberAiOptIn(organizationId, userId)
  if (!userOptIn) {
    return jsonError(
      "Enable AI-assisted features in Settings to use this action.",
      403,
      "ai_opt_in_required"
    )
  }
  return null
}
