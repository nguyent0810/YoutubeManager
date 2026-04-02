import { prisma } from "@/lib/db"
import { decryptGeminiApiKey } from "@/lib/gemini-key-crypto"

/**
 * User's saved key for this workspace takes precedence over deployment
 * GEMINI_API_KEY (own quota and control).
 */
export async function resolveGeminiApiKeyForUser(
  organizationId: string,
  userId: string
): Promise<string | null> {
  const m = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { geminiApiKeyEnc: true },
  })
  if (m?.geminiApiKeyEnc) {
    try {
      const k = decryptGeminiApiKey(m.geminiApiKeyEnc).trim()
      return k || null
    } catch {
      return null
    }
  }
  const env = process.env.GEMINI_API_KEY?.trim()
  return env || null
}

export function hasDeploymentGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}
