"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "@/components/ui/toast"

function JoinInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState<
    "idle" | "success" | "error" | "missing"
  >("idle")

  React.useEffect(() => {
    if (!token) setDone("missing")
  }, [token])

  const accept = async () => {
    if (!token) return
    setBusy(true)
    try {
      const res = await fetch("/api/orgs/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not accept invite"
        throw new Error(msg)
      }
      setDone("success")
      toast.success("You joined the workspace.")
      router.replace("/dashboard/team")
      router.refresh()
    } catch (e: unknown) {
      setDone("error")
      toast.error(e instanceof Error ? e.message : "Accept failed")
    } finally {
      setBusy(false)
    }
  }

  if (done === "missing" || !token) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>Join workspace</CardTitle>
            <CardDescription>
              This page needs a valid invite link with a token query parameter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => router.push("/dashboard")}>
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Accept invitation</CardTitle>
          <CardDescription>
            You will be added to the workspace that sent this invite. You must
            be signed in with the same email the invite was sent to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            disabled={busy || done === "success"}
            onClick={() => void accept()}
          >
            {busy ? "Joining…" : "Join workspace"}
          </Button>
          {done === "error" ? (
            <p className="text-sm text-muted-foreground">
              Fix the issue above, or ask an admin for a new invite.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      }
    >
      <JoinInner />
    </Suspense>
  )
}
