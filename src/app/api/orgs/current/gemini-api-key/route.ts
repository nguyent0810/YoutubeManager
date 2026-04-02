import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireOrgRead } from "@/lib/api-org-context"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { writeAuditLog } from "@/lib/audit-log"
import { encryptGeminiApiKey } from "@/lib/gemini-key-crypto"
import { logApiError } from "@/lib/logger"

const postSchema = z.object({
  apiKey: z.string().trim().min(20).max(512),
})

export async function POST(req: Request) {
  try {
    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const json: unknown = await req.json()
    const parsed = postSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid API key", 400, "validation_error")
    }

    let enc: string
    try {
      enc = encryptGeminiApiKey(parsed.data.apiKey)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Encryption failed"
      return jsonError(msg, 503, "encryption_unconfigured")
    }

    const updated = await prisma.organizationMember.updateMany({
      where: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
      },
      data: { geminiApiKeyEnc: enc },
    })

    if (updated.count === 0) {
      return jsonError("Membership not found", 404)
    }

    await writeAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "gemini_personal_key_set",
      entity: "OrganizationMember",
      metadata: { workspaceScoped: true },
    })

    return Response.json({ ok: true })
  } catch (error: unknown) {
    logApiError("POST /api/orgs/current/gemini-api-key", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to save key",
      httpStatusFromError(error)
    )
  }
}

export async function DELETE() {
  try {
    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const updated = await prisma.organizationMember.updateMany({
      where: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
      },
      data: { geminiApiKeyEnc: null },
    })

    if (updated.count === 0) {
      return jsonError("Membership not found", 404)
    }

    await writeAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "gemini_personal_key_removed",
      entity: "OrganizationMember",
      metadata: {},
    })

    return Response.json({ ok: true })
  } catch (error: unknown) {
    logApiError("DELETE /api/orgs/current/gemini-api-key", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to remove key",
      httpStatusFromError(error)
    )
  }
}
