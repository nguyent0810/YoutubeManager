/**
 * Server-side logging helpers. Never log access tokens, refresh tokens, or cookies.
 */
const SENSITIVE_KEYS = /token|secret|authorization|password|cookie/i

export function logApiError(
  context: string,
  error: unknown,
  extra?: Record<string, string | number | undefined>
): void {
  const message =
    error instanceof Error ? error.message : String(error)
  const safeExtra = extra
    ? Object.fromEntries(
        Object.entries(extra).filter(([k]) => !SENSITIVE_KEYS.test(k))
      )
    : undefined
  console.error(`[ytm-api] ${context}`, message, safeExtra ?? "")
}

export function logInfo(context: string, detail?: string): void {
  if (process.env.NODE_ENV === "development") {
    console.info(`[ytm-api] ${context}`, detail ?? "")
  }
}
