import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireYoutubeMutationAllowed } from "@/lib/api-org-context"
import { verifyUploadSessionToken } from "@/lib/upload-session-token"
import { youtubeErrorFromResponse } from "@/lib/youtube"

export const maxDuration = 300

/** Forward one chunk to YouTube’s resumable `Location` URL (avoids browser CORS). */
export async function POST(req: Request) {
  try {
    const gate = await requireYoutubeMutationAllowed()
    if (gate instanceof Response) return gate

    const authz = req.headers.get("Authorization")
    const sessionToken =
      authz?.startsWith("Bearer ") ? authz.slice(7).trim() : null
    if (!sessionToken) {
      return jsonError("Missing Authorization: Bearer sessionToken", 401)
    }

    const session = verifyUploadSessionToken(sessionToken)
    if (!session) {
      return jsonError("Invalid or expired upload session", 401)
    }

    const contentRange = req.headers.get("Content-Range")
    if (!contentRange || !contentRange.startsWith("bytes ")) {
      return jsonError("Content-Range header required (e.g. bytes 0-1/100)", 400)
    }

    const buf = await req.arrayBuffer()
    if (buf.byteLength === 0) {
      return jsonError("Empty chunk body", 400)
    }

    const googleRes = await fetch(session.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(buf.byteLength),
        "Content-Range": contentRange,
      },
      body: buf,
    })

    const raw = await googleRes.text()

    if (googleRes.status === 308) {
      return Response.json({
        done: false,
        range: googleRes.headers.get("Range"),
      })
    }

    if (googleRes.status === 200) {
      let video: unknown
      try {
        video = raw.trim() ? JSON.parse(raw) : null
      } catch {
        return jsonError("YouTube returned invalid JSON on upload complete", 502)
      }
      return Response.json({ done: true, video })
    }

    youtubeErrorFromResponse(googleRes.status, raw)
  } catch (error: unknown) {
    logApiError("POST /api/youtube/upload/chunk", error)
    return jsonError(
      error instanceof Error ? error.message : "Chunk upload failed",
      httpStatusFromError(error)
    )
  }
}
