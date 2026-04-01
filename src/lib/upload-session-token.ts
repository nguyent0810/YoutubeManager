import { createHmac, timingSafeEqual } from "node:crypto"

function secret(): string {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? ""
}

/** Signed token carrying the YouTube resumable `Location` URL (chunk uploads). */
export function createUploadSessionToken(
  uploadUrl: string,
  ttlMs: number
): string {
  const s = secret()
  if (!s) throw new Error("AUTH_SECRET is required for upload sessions")

  const exp = Date.now() + ttlMs
  const payload = JSON.stringify({ u: uploadUrl, exp })
  const body = Buffer.from(payload, "utf8").toString("base64url")
  const sig = createHmac("sha256", s).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyUploadSessionToken(
  token: string
): { uploadUrl: string } | null {
  const s = secret()
  if (!s) return null

  const lastDot = token.lastIndexOf(".")
  if (lastDot === -1) return null
  const body = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  const expected = createHmac("sha256", s).update(body).digest("base64url")
  if (sig.length !== expected.length) return null
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }

  let parsed: { u?: unknown; exp?: unknown }
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
  } catch {
    return null
  }
  if (typeof parsed.u !== "string" || typeof parsed.exp !== "number")
    return null
  if (Date.now() > parsed.exp) return null
  return { uploadUrl: parsed.u }
}
