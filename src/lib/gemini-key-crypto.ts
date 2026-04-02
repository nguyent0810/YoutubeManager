import crypto from "node:crypto"

const IV_LEN = 16
const AUTH_TAG_LEN = 16
const ALGO = "aes-256-gcm"

function encryptionMasterKey(): Buffer {
  const s =
    process.env.GEMINI_KEY_ENCRYPTION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim()
  if (!s) {
    throw new Error(
      "Set GEMINI_KEY_ENCRYPTION_SECRET or AUTH_SECRET to store a personal Gemini API key."
    )
  }
  return crypto.createHash("sha256").update(s).digest()
}

/** Encrypt for storage in Postgres (base64). */
export function encryptGeminiApiKey(plain: string): string {
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, encryptionMasterKey(), iv, {
    authTagLength: AUTH_TAG_LEN,
  })
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64")
}

export function decryptGeminiApiKey(blob: string): string {
  const buf = Buffer.from(blob, "base64")
  if (buf.length < IV_LEN + AUTH_TAG_LEN + 1) {
    throw new Error("Invalid encrypted key blob")
  }
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN)
  const data = buf.subarray(IV_LEN + AUTH_TAG_LEN)
  const decipher = crypto.createDecipheriv(ALGO, encryptionMasterKey(), iv, {
    authTagLength: AUTH_TAG_LEN,
  })
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  )
}
