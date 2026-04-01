import { auth } from "@/lib/auth"

/** Stable user id for DB rows (Google `sub` from JWT, or email fallback). */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth()
  const id = session?.user?.id
  if (typeof id === "string" && id.length > 0) return id
  return null
}
