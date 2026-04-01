"use client"

import { signIn, useSession } from "next-auth/react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Shown when Google access token refresh failed; user must sign in again.
 */
export function SessionAlert() {
  const { data: session, status } = useSession()

  if (status !== "authenticated" || session?.error !== "RefreshAccessTokenError") {
    return null
  }

  return (
    <div
      className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div className="flex gap-2">
        <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-medium text-foreground">Session expired</p>
          <p className="text-muted-foreground">
            Reconnect your Google account to keep using YouTube features.
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        Reconnect Google
      </Button>
    </div>
  )
}
