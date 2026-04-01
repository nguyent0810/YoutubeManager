import { NextResponse } from "next/server"
import { YouTubeApiError } from "@/lib/youtube"

export type ApiErrorBody = { error: string; code?: string }

export function jsonError(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: message }
  if (code) body.code = code
  return NextResponse.json(body, { status })
}

export function isUnauthorizedMessage(message: string): boolean {
  return (
    message.includes("Unauthorized") ||
    message.includes("No YouTube access token")
  )
}

export function statusFromYouTubeError(message: string): number {
  if (isUnauthorizedMessage(message)) return 401
  if (message.includes("quota") || message.includes("Quota")) return 429
  return 500
}

/** Prefer `YouTubeApiError.statusCode` when present; otherwise infer from message. */
export function httpStatusFromError(error: unknown): number {
  if (error instanceof YouTubeApiError) return error.statusCode
  if (error instanceof Error) return statusFromYouTubeError(error.message)
  return 500
}
