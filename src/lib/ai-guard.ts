import { jsonError } from "@/lib/api-response"
import { isAiFullyEnabled } from "@/lib/ai-policy"
import { prisma } from "@/lib/db"
import { isOrgFeatureEnabled, ORG_FEATURE_AI } from "@/lib/features"
import {
  hasDeploymentGeminiKey,
  resolveGeminiApiKeyForUser,
} from "@/lib/resolve-gemini-key"

export { isAiFullyEnabled } from "@/lib/ai-policy"

export type AiGateResult = Response | { apiKey: string }

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

export async function memberHasStoredGeminiKey(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const m = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { geminiApiKeyEnc: true },
  })
  return Boolean(m?.geminiApiKeyEnc?.trim())
}

export async function getAiStatusForUser(
  organizationId: string,
  userId: string
): Promise<{
  configured: boolean
  hasPersonalKey: boolean
  hasEnvKey: boolean
  orgEnabled: boolean
  userOptIn: boolean
  allowed: boolean
}> {
  const hasPersonalKey = await memberHasStoredGeminiKey(organizationId, userId)
  const hasEnvKey = hasDeploymentGeminiKey()
  const configured = hasPersonalKey || hasEnvKey
  const orgEnabled = await isOrgFeatureEnabled(organizationId, ORG_FEATURE_AI)
  const userOptIn = await getMemberAiOptIn(organizationId, userId)
  return {
    configured,
    hasPersonalKey,
    hasEnvKey,
    orgEnabled,
    userOptIn,
    allowed: isAiFullyEnabled({ configured, orgEnabled, userOptIn }),
  }
}

/** Returns a JSON Response when blocked, or the API key to use for Gemini. */
export async function assertAiAllowed(
  organizationId: string,
  userId: string
): Promise<AiGateResult> {
  const apiKey = await resolveGeminiApiKeyForUser(organizationId, userId)
  if (!apiKey) {
    return jsonError(
      "No Gemini API key available. Add your key in Settings → AI-assisted features, or set GEMINI_API_KEY on the server.",
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
  return { apiKey }
}
