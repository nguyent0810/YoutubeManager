"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { useOrgCurrent } from "@/hooks/use-org"
import { orgRoleAtLeast } from "@/lib/org-role"

interface MemberRow {
  id: string
  userId: string
  role: string
  createdAt: string
}

interface InviteRow {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt: string
}

export default function TeamPage() {
  const qc = useQueryClient()
  const orgQ = useOrgCurrent()
  const orgId = orgQ.data?.activeOrganizationId
  const isAdmin = orgRoleAtLeast(orgQ.data?.activeRole, "ADMIN")

  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteBusy, setInviteBusy] = React.useState(false)

  const membersQ = useQuery({
    queryKey: ["orgs", orgId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${orgId}/members`)
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to load members"
        throw new Error(msg)
      }
      return (data as { members: MemberRow[] }).members
    },
    enabled: Boolean(orgId) && orgQ.isSuccess,
  })

  const invitesQ = useQuery({
    queryKey: ["orgs", orgId, "invites"],
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${orgId}/invites`)
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to load invites"
        throw new Error(msg)
      }
      return (data as { invites: InviteRow[] }).invites
    },
    enabled: Boolean(orgId) && orgQ.isSuccess && isAdmin,
  })

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !inviteEmail.trim()) return
    setInviteBusy(true)
    try {
      const res = await fetch(`/api/orgs/${orgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: "MEMBER" }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Invite failed"
        throw new Error(msg)
      }
      const token =
        typeof data === "object" &&
        data !== null &&
        "token" in data &&
        typeof (data as { token: unknown }).token === "string"
          ? (data as { token: string }).token
          : null
      setInviteEmail("")
      if (token) {
        const origin = window.location.origin
        void navigator.clipboard.writeText(
          `${origin}/dashboard/join?token=${encodeURIComponent(token)}`
        )
        toast.success("Invite created. Join link copied to clipboard.")
      } else {
        toast.success("Invite created.")
      }
      await qc.invalidateQueries({ queryKey: ["orgs", orgId, "invites"] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invite failed")
    } finally {
      setInviteBusy(false)
    }
  }

  const revokeInvite = async (inviteId: string) => {
    if (!orgId) return
    try {
      const res = await fetch(`/api/orgs/${orgId}/invites/${inviteId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data: unknown = await res.json()
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to revoke"
        throw new Error(msg)
      }
      toast.success("Invite revoked.")
      await qc.invalidateQueries({ queryKey: ["orgs", orgId, "invites"] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke")
    }
  }

  if (orgQ.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading workspace…</p>
    )
  }

  if (orgQ.isError || !orgId) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">Team</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {orgQ.error instanceof Error ? orgQ.error.message : "No workspace."}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Members of the active workspace. Roles: viewer (read), member
          (edit), admin (invites), owner (full control).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            User IDs are stable Google subjects from sign-in (opaque in the
            UI).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : membersQ.isError ? (
            <p className="text-sm text-destructive">
              {membersQ.error instanceof Error
                ? membersQ.error.message
                : "Failed to load"}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(membersQ.data ?? []).map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <code className="text-xs text-muted-foreground">
                    {m.userId}
                  </code>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Invites</CardTitle>
            <CardDescription>
              Invite by email. The person must sign in with that Google account
              and open the join link (copied automatically after create).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={sendInvite} className="flex flex-wrap gap-2">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="min-w-[200px] flex-1"
              />
              <Button type="submit" disabled={inviteBusy || !inviteEmail.trim()}>
                {inviteBusy ? "Sending…" : "Invite"}
              </Button>
            </form>
            {invitesQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading invites…</p>
            ) : invitesQ.isError ? (
              <p className="text-sm text-destructive">
                {invitesQ.error instanceof Error
                  ? invitesQ.error.message
                  : "Failed to load invites"}
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(invitesQ.data ?? []).length === 0 ? (
                  <li className="text-muted-foreground">No pending invites.</li>
                ) : (
                  (invitesQ.data ?? []).map((i) => (
                    <li
                      key={i.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <span>{i.email}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {i.role} · expires{" "}
                          {new Date(i.expiresAt).toLocaleDateString()}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void revokeInvite(i.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
