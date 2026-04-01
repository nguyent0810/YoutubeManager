/**
 * Canonical public URL for metadata, redirects, and Auth.js.
 * Vercel sets VERCEL_URL (no scheme); prefer explicit AUTH_URL / NEXTAUTH_URL in production.
 */
export function getSiteUrl(): string {
  const auth = process.env.AUTH_URL?.trim()
  if (auth) return auth.replace(/\/$/, "")

  const nextAuth = process.env.NEXTAUTH_URL?.trim()
  if (nextAuth) return nextAuth.replace(/\/$/, "")

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`

  return "http://localhost:3000"
}
