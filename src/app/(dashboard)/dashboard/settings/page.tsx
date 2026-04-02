"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { signOut, useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Input } from "@/components/ui/input"
import { LogOut } from "lucide-react"
import { toast } from "@/components/ui/toast"
import { useAiStatus, useOrgCurrent, useOrgFeatures } from "@/hooks/use-org"
import { orgRoleAtLeast } from "@/lib/org-role"
import { queryKeys } from "@/lib/query-keys"
import { ApiQuotaCard } from "@/components/help/api-quota-card"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const qc = useQueryClient()
  const orgQ = useOrgCurrent()
  const featQ = useOrgFeatures()
  const aiQ = useAiStatus()
  const auditQ = useQuery({
    queryKey: queryKeys.auditLogs(50),
    queryFn: async () => {
      const res = await fetch("/api/orgs/current/audit-logs?limit=50")
      const data = (await res.json()) as {
        error?: string
        logs?: Array<{
          id: string
          userId: string
          action: string
          entity: string | null
          metadata: unknown
          createdAt: string
        }>
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to load audit log")
      return data.logs ?? []
    },
    enabled: orgRoleAtLeast(orgQ.data?.activeRole, "ADMIN"),
  })
  const [newOrgName, setNewOrgName] = React.useState("")
  const [createBusy, setCreateBusy] = React.useState(false)
  const [switchBusy, setSwitchBusy] = React.useState(false)
  const [featBusy, setFeatBusy] = React.useState(false)

  const isOwner = orgRoleAtLeast(orgQ.data?.activeRole, "OWNER")
  const isAdmin = orgRoleAtLeast(orgQ.data?.activeRole, "ADMIN")

  const switchOrg = async (organizationId: string, silent?: boolean) => {
    setSwitchBusy(true)
    try {
      const res = await fetch("/api/orgs/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not switch workspace"
        throw new Error(msg)
      }
      if (!silent) toast.success("Workspace updated.")
      await qc.invalidateQueries({ queryKey: queryKeys.orgCurrent })
      await qc.invalidateQueries({ queryKey: queryKeys.orgFeatures })
      await qc.invalidateQueries({ queryKey: queryKeys.pipeline })
      await qc.invalidateQueries({ queryKey: queryKeys.savedReplies })
      await qc.invalidateQueries({ queryKey: queryKeys.aiStatus })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Switch failed")
    } finally {
      setSwitchBusy(false)
    }
  }

  const createOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return
    setCreateBusy(true)
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName.trim() }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Create failed"
        throw new Error(msg)
      }
      const id =
        typeof data === "object" &&
        data !== null &&
        "id" in data &&
        typeof (data as { id: unknown }).id === "string"
          ? (data as { id: string }).id
          : null
      setNewOrgName("")
      await qc.invalidateQueries({ queryKey: queryKeys.orgCurrent })
      if (id) await switchOrg(id, true)
      toast.success("Workspace created and selected.")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Create failed")
    } finally {
      setCreateBusy(false)
    }
  }

  const patchFeatures = async (patch: {
    exports?: boolean
    youtube_writes?: boolean
    ai_features?: boolean
  }) => {
    setFeatBusy(true)
    try {
      const res = await fetch("/api/orgs/current/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Update failed"
        throw new Error(msg)
      }
      toast.success("Feature settings saved.")
      await qc.invalidateQueries({ queryKey: queryKeys.orgFeatures })
      await qc.invalidateQueries({ queryKey: queryKeys.aiStatus })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setFeatBusy(false)
    }
  }

  const [aiPrefBusy, setAiPrefBusy] = React.useState(false)
  const patchAiPreference = async (optIn: boolean) => {
    setAiPrefBusy(true)
    try {
      const res = await fetch("/api/orgs/current/ai-preference", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Update failed"
        throw new Error(msg)
      }
      toast.success(optIn ? "AI assistance enabled." : "AI assistance disabled.")
      await qc.invalidateQueries({ queryKey: queryKeys.aiStatus })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setAiPrefBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Appearance, account, workspace, and owner feature flags.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Light, dark, or follow your system. Transitions respect reduced motion.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Saved replies and pipeline cards are scoped to the active workspace.
            Switching reloads lists from the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orgQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading workspaces…</p>
          ) : orgQ.isError ? (
            <p className="text-sm text-destructive">
              {orgQ.error instanceof Error
                ? orgQ.error.message
                : "Could not load workspaces"}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Active workspace
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {(orgQ.data?.organizations ?? []).map((o) => (
                    <Button
                      key={o.id}
                      type="button"
                      size="sm"
                      variant={
                        o.id === orgQ.data?.activeOrganizationId
                          ? "default"
                          : "outline"
                      }
                      disabled={switchBusy}
                      onClick={() => void switchOrg(o.id)}
                    >
                      {o.name}
                      <span className="ml-1.5 text-[10px] opacity-80">
                        ({o.role})
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              <form onSubmit={createOrg} className="flex flex-wrap gap-2">
                <Input
                  placeholder="New workspace name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="max-w-xs flex-1"
                />
                <Button type="submit" disabled={createBusy || !newOrgName.trim()}>
                  {createBusy ? "Creating…" : "Create workspace"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <ApiQuotaCard />

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Workspace features</CardTitle>
            <CardDescription>
              Owner-only overrides. Defaults come from environment (
              <code className="rounded bg-muted px-1">FEATURE_EXPORTS_DEFAULT</code>
              ,{" "}
              <code className="rounded bg-muted px-1">
                FEATURE_YOUTUBE_WRITES_DEFAULT
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1">FEATURE_AI_DEFAULT</code>
              ); set to <code className="rounded bg-muted px-1">false</code> to
              default off for new orgs without a DB row.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {featQ.isLoading ? (
              <p className="text-muted-foreground">Loading feature flags…</p>
            ) : featQ.isError ? (
              <p className="text-destructive">
                {featQ.error instanceof Error
                  ? featQ.error.message
                  : "Could not load features"}
              </p>
            ) : featQ.data ? (
              <>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={featQ.data.exports}
                    disabled={featBusy}
                    onChange={(e) =>
                      void patchFeatures({ exports: e.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium">Pipeline CSV export</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      Enables the Export CSV button on the pipeline board.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={featQ.data.youtube_writes}
                    disabled={featBusy}
                    onChange={(e) =>
                      void patchFeatures({ youtube_writes: e.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium">YouTube write actions</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      Comment replies, playlist adds, and video metadata edits
                      from this app. When off, those API routes return 403 for
                      this workspace.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={featQ.data.ai_features ?? false}
                    disabled={featBusy || !aiQ.data?.configured}
                    onChange={(e) =>
                      void patchFeatures({ ai_features: e.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium">AI-assisted drafting</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      Optional Gemini-powered suggestions for bulk upload
                      metadata and reply polish. Requires{" "}
                      <code className="rounded bg-muted px-1">GEMINI_API_KEY</code>{" "}
                      on the server. Each member must still opt in below.
                    </span>
                  </span>
                </label>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>AI-assisted features (Gemini)</CardTitle>
          <CardDescription>
            Suggestions are drafts only—always review before uploading or
            posting. Nothing is sent to Google unless you opt in and use an AI
            action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {aiQ.isLoading ? (
            <p className="text-muted-foreground">Loading AI status…</p>
          ) : aiQ.isError ? (
            <p className="text-destructive">
              {aiQ.error instanceof Error
                ? aiQ.error.message
                : "Could not load AI status"}
            </p>
          ) : aiQ.data && !aiQ.data.configured ? (
            <p className="text-muted-foreground">
              AI is not configured on this deployment. Set{" "}
              <code className="rounded bg-muted px-1">GEMINI_API_KEY</code> in
              the server environment to enable it.
            </p>
          ) : aiQ.data && !aiQ.data.orgEnabled ? (
            <p className="text-muted-foreground">
              The workspace owner has not enabled AI-assisted drafting for this
              workspace yet.
            </p>
          ) : aiQ.data ? (
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={aiQ.data.userOptIn}
                disabled={aiPrefBusy}
                onChange={(e) => void patchAiPreference(e.target.checked)}
              />
              <span>
                <span className="font-medium">Use AI-assisted features</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Enables bulk metadata suggestions and reply polish where
                  shown in the app.
                </span>
              </span>
            </label>
          ) : null}
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
            <CardDescription>
              Recent workspace actions (invites, feature flags, workspace
              switches) visible to admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : auditQ.isError ? (
              <p className="text-sm text-destructive">
                {auditQ.error instanceof Error
                  ? auditQ.error.message
                  : "Could not load audit log"}
              </p>
            ) : !auditQ.data?.length ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <ul className="max-h-80 space-y-3 overflow-y-auto text-sm">
                {auditQ.data.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2"
                  >
                    <p className="font-medium text-foreground">{row.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString()} · user{" "}
                      <span className="font-mono">{row.userId.slice(0, 12)}…</span>
                    </p>
                    {row.metadata != null ? (
                      <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
                        {JSON.stringify(row.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in with Google via NextAuth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" ? (
            <p className="text-sm text-muted-foreground">Loading session…</p>
          ) : user ? (
            <div className="flex items-center gap-4">
              <Avatar
                src={user.image}
                alt={user.name ?? ""}
                fallback={user.name ?? user.email ?? "?"}
                size="lg"
              />
              <div className="min-w-0">
                <p className="font-medium">{user.name}</p>
                {user.email ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active session.</p>
          )}
          <Button
            type="button"
            variant="destructive"
            className="gap-2"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
