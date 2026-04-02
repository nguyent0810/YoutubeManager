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
  const [geminiModalOpen, setGeminiModalOpen] = React.useState(false)
  const [geminiKeyInput, setGeminiKeyInput] = React.useState("")
  const [geminiKeyBusy, setGeminiKeyBusy] = React.useState(false)
  const saveGeminiApiKey = async () => {
    const k = geminiKeyInput.trim()
    if (k.length < 20) {
      toast.error("Paste a valid API key from Google AI Studio.")
      return
    }
    setGeminiKeyBusy(true)
    try {
      const res = await fetch("/api/orgs/current/gemini-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: k }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not save key"
        throw new Error(msg)
      }
      setGeminiKeyInput("")
      setGeminiModalOpen(false)
      toast.success("Gemini API key saved for this workspace (encrypted).")
      await qc.invalidateQueries({ queryKey: queryKeys.aiStatus })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setGeminiKeyBusy(false)
    }
  }

  const removeGeminiApiKey = async () => {
    if (!window.confirm("Remove your saved Gemini API key for this workspace?")) return
    setGeminiKeyBusy(true)
    try {
      const res = await fetch("/api/orgs/current/gemini-api-key", {
        method: "DELETE",
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not remove key"
        throw new Error(msg)
      }
      toast.success("Personal Gemini key removed.")
      await qc.invalidateQueries({ queryKey: queryKeys.aiStatus })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Remove failed")
    } finally {
      setGeminiKeyBusy(false)
    }
  }

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
                    disabled={featBusy}
                    onChange={(e) =>
                      void patchFeatures({ ai_features: e.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium">AI-assisted drafting</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      Optional Gemini-powered suggestions for bulk upload
                      metadata and reply polish. Members can add their own API
                      key in Settings, or the deployment can set{" "}
                      <code className="rounded bg-muted px-1">GEMINI_API_KEY</code>
                      . Each member must still opt in below.
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
          ) : aiQ.data ? (
            <>
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <p className="font-medium text-foreground">Gemini API access</p>
                <p className="text-xs text-muted-foreground">
                  Your key is stored encrypted for this workspace only and is
                  never shown back in the UI. You can use a{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Google AI Studio key
                  </a>{" "}
                  instead of relying on the server{" "}
                  <code className="rounded bg-muted px-1">GEMINI_API_KEY</code>.
                  If you add your own key, it is used for your requests before
                  any deployment key.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={geminiKeyBusy}
                    onClick={() => setGeminiModalOpen(true)}
                  >
                    {aiQ.data.hasPersonalKey
                      ? "Update personal API key"
                      : "Add personal API key"}
                  </Button>
                  {aiQ.data.hasPersonalKey ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={geminiKeyBusy}
                      onClick={() => void removeGeminiApiKey()}
                    >
                      Remove personal key
                    </Button>
                  ) : null}
                </div>
                {aiQ.data.hasPersonalKey ? (
                  <p className="text-xs text-muted-foreground">
                    Personal key on file for this workspace.
                  </p>
                ) : null}
                {aiQ.data.hasEnvKey ? (
                  <p className="text-xs text-muted-foreground">
                    This deployment also provides a shared server key (fallback
                    if you do not add your own).
                  </p>
                ) : null}
                {!aiQ.data.configured ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Add a personal key above, or ask your host to set{" "}
                    <code className="rounded bg-muted px-1">GEMINI_API_KEY</code>
                    .
                  </p>
                ) : null}
              </div>

              {!aiQ.data.orgEnabled ? (
                <p className="text-muted-foreground">
                  The workspace owner has not enabled AI-assisted drafting for
                  this workspace yet.
                </p>
              ) : (
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
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {geminiModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => !geminiKeyBusy && setGeminiModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg"
            role="dialog"
            aria-labelledby="gemini-key-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="gemini-key-title"
              className="text-lg font-semibold tracking-tight"
            >
              Personal Gemini API key
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste your key once. It is encrypted with your app&apos;s{" "}
              <code className="rounded bg-muted px-1">AUTH_SECRET</code> or{" "}
              <code className="rounded bg-muted px-1">
                GEMINI_KEY_ENCRYPTION_SECRET
              </code>{" "}
              before storage.
            </p>
            <Input
              type="password"
              autoComplete="off"
              placeholder="AIza…"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              className="mt-4 font-mono text-sm"
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={geminiKeyBusy}
                onClick={() => {
                  setGeminiModalOpen(false)
                  setGeminiKeyInput("")
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={geminiKeyBusy || geminiKeyInput.trim().length < 20}
                onClick={() => void saveGeminiApiKey()}
              >
                {geminiKeyBusy ? "Saving…" : "Save key"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
