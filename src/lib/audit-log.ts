import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { logApiError } from "@/lib/logger"

export async function writeAuditLog(params: {
  organizationId: string
  userId: string
  action: string
  entity?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const metadata: Prisma.InputJsonValue | undefined =
      params.metadata === undefined
        ? undefined
        : (JSON.parse(JSON.stringify(params.metadata)) as Prisma.InputJsonValue)

    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        metadata,
      },
    })
  } catch (error: unknown) {
    logApiError("writeAuditLog", error)
  }
}
