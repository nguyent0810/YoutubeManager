"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Trash2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { useOrgFeatures } from "@/hooks/use-org"
import { YOUTUBE_CATEGORY_OPTIONS } from "@/lib/youtube-categories"
import {
  addVideoToPlaylist,
  fetchMyPlaylists,
  uploadLocalFileToYoutube,
  type YoutubeUploadInitPayload,
} from "@/lib/youtube-client"

function stripExtension(filename: string) {
  const dot = filename.lastIndexOf(".")
  return dot > 0 ? filename.slice(0, dot) : filename
}

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type VisibilityMode = "public" | "private" | "unlisted" | "schedule"

interface QueueRow {
  id: string
  file: File
  title: string
  status: "queued" | "uploading" | "done" | "error"
  progress: number
  error?: string
  videoId?: string
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30)
}

export function BulkUploadForm() {
  const features = useOrgFeatures()
  const writesOk = features.data?.youtube_writes ?? true

  const playlistsQ = useQuery({
    queryKey: ["youtube", "playlists", "mine"],
    queryFn: fetchMyPlaylists,
  })

  const [queue, setQueue] = React.useState<QueueRow[]>([])
  const [description, setDescription] = React.useState("")
  const [tagsRaw, setTagsRaw] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("22")
  const [visibility, setVisibility] = React.useState<VisibilityMode>("public")
  const [scheduleLocal, setScheduleLocal] = React.useState("")
  const [madeForKids, setMadeForKids] = React.useState(false)
  const [playlistId, setPlaylistId] = React.useState("")
  const [running, setRunning] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    const next: QueueRow[] = []
    for (let i = 0; i < list.length; i++) {
      const file = list[i]
      if (file.size <= 0) {
        toast.error(`Skipped empty file: ${file.name}`)
        continue
      }
      if (file.size > 20 * 1024 * 1024 * 1024) {
        toast.error(`Skipped (over 20 GB): ${file.name}`)
        continue
      }
      next.push({
        id: randomId(),
        file,
        title: stripExtension(file.name).slice(0, 100),
        status: "queued",
        progress: 0,
      })
    }
    if (next.length) setQueue((q) => [...q, ...next])
  }

  const updateTitle = (id: string, title: string) => {
    setQueue((q) =>
      q.map((r) => (r.id === id ? { ...r, title: title.slice(0, 100) } : r))
    )
  }

  const removeRow = (id: string) => {
    setQueue((q) => q.filter((r) => r.id !== id))
  }

  const clearDone = () => {
    setQueue((q) => q.filter((r) => r.status !== "done"))
  }

  const buildMetadataBase = (): Omit<
    YoutubeUploadInitPayload,
    "title" | "contentLength" | "contentType"
  > => {
    const tags = parseTags(tagsRaw)
    let privacyStatus: YoutubeUploadInitPayload["privacyStatus"] = "public"
    let publishAt: string | null | undefined

    if (visibility === "private") privacyStatus = "private"
    else if (visibility === "unlisted") privacyStatus = "unlisted"
    else if (visibility === "schedule") {
      if (!scheduleLocal.trim()) {
        throw new Error("Pick a date and time for scheduled publishing.")
      }
      const when = new Date(scheduleLocal)
      if (Number.isNaN(when.getTime())) {
        throw new Error("Invalid schedule date.")
      }
      if (when.getTime() < Date.now() + 60_000) {
        throw new Error("Schedule time must be at least one minute from now.")
      }
      privacyStatus = "private"
      publishAt = when.toISOString()
    } else {
      privacyStatus = "public"
      publishAt = undefined
    }

    return {
      description: description.trim() || undefined,
      tags: tags.length ? tags : undefined,
      categoryId,
      privacyStatus,
      publishAt: publishAt ?? null,
      selfDeclaredMadeForKids: madeForKids,
    }
  }

  const runQueue = async () => {
    if (!writesOk) {
      toast.error("YouTube writes are disabled for this workspace.")
      return
    }
    if (!queue.length) {
      toast.error("Add video files first.")
      return
    }

    let base: ReturnType<typeof buildMetadataBase>
    try {
      base = buildMetadataBase()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invalid options")
      return
    }

    const pending = queue.filter((r) => r.status === "queued" || r.status === "error")
    if (!pending.length) {
      toast.error("No queued items to upload.")
      return
    }

    setRunning(true)
    for (const row of pending) {
      setQueue((q) =>
        q.map((r) =>
          r.id === row.id
            ? { ...r, status: "uploading", progress: 0, error: undefined }
            : r
        )
      )

      try {
        const title = row.title.trim() || stripExtension(row.file.name).slice(0, 100)
        if (!title) {
          throw new Error("Title required.")
        }

        const { id } = await uploadLocalFileToYoutube(
          row.file,
          { ...base, title },
          (p) => {
            setQueue((q) =>
              q.map((r) => (r.id === row.id ? { ...r, progress: p } : r))
            )
          }
        )

        if (playlistId) {
          try {
            await addVideoToPlaylist(playlistId, id)
          } catch (e: unknown) {
            toast.error(
              e instanceof Error
                ? `Uploaded but playlist failed: ${e.message}`
                : "Uploaded but playlist add failed."
            )
          }
        }

        setQueue((q) =>
          q.map((r) =>
            r.id === row.id
              ? { ...r, status: "done", progress: 100, videoId: id }
              : r
          )
        )
        toast.success(`Uploaded: ${title}`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Upload failed"
        setQueue((q) =>
          q.map((r) =>
            r.id === row.id
              ? { ...r, status: "error", progress: 0, error: msg }
              : r
          )
        )
        toast.error(msg)
      }
    }
    setRunning(false)
  }

  const playlists = playlistsQ.data ?? []

  return (
    <div className="space-y-6">
      {!writesOk ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Uploads blocked</CardTitle>
            <CardDescription>
              The workspace owner disabled YouTube write actions, or your role
              cannot upload. Check Settings → workspace features or your role on
              Team.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Defaults (all files)</CardTitle>
          <CardDescription>
            Each row can override the title. Description, tags, category, and
            visibility apply to every file in the queue. Scheduled videos are
            uploaded as private until YouTube publishes them at the chosen
            time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="bu-desc">
                Description
              </label>
              <textarea
                id="bu-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={5000}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="bu-tags">
                Tags (comma-separated)
              </label>
              <Input
                id="bu-tags"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="tutorial, vlog, 4k"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="bu-cat">
                Category
              </label>
              <select
                id="bu-cat"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {YOUTUBE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Visibility</span>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="vis"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  Public when processing completes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="vis"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                  />
                  Private
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="vis"
                    checked={visibility === "unlisted"}
                    onChange={() => setVisibility("unlisted")}
                  />
                  Unlisted
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="vis"
                    checked={visibility === "schedule"}
                    onChange={() => setVisibility("schedule")}
                  />
                  Schedule public release
                </label>
              </div>
              {visibility === "schedule" ? (
                <Input
                  type="datetime-local"
                  value={scheduleLocal}
                  onChange={(e) => setScheduleLocal(e.target.value)}
                  className="mt-2 max-w-xs"
                />
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={madeForKids}
                onChange={(e) => setMadeForKids(e.target.checked)}
              />
              Made for kids (required; affects features and compliance)
            </label>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="bu-pl">
                Add to playlist (optional)
              </label>
              <select
                id="bu-pl"
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                disabled={playlistsQ.isLoading}
                className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— None —</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Queue</CardTitle>
              <CardDescription>
                Files upload one after another (YouTube quota). Max 20 GB per
                file in this build.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ""
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!writesOk}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="size-4" />
                Add videos
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={!writesOk || running}
                onClick={() => void runQueue()}
              >
                {running ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Start uploads"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearDone}
                disabled={!queue.some((r) => r.status === "done")}
              >
                Clear finished
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No files yet. Use “Add videos” to build a batch.
            </p>
          ) : (
            <ul className="space-y-3">
              {queue.map((row) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {row.file.name} · {(row.file.size / (1024 * 1024)).toFixed(1)}{" "}
                        MB
                      </p>
                      <Input
                        value={row.title}
                        onChange={(e) => updateTitle(row.id, e.target.value)}
                        maxLength={100}
                        disabled={row.status === "uploading"}
                        placeholder="Title"
                      />
                      {row.status === "uploading" || row.progress > 0 ? (
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-[width] motion-reduce:transition-none"
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                      ) : null}
                      {row.error ? (
                        <p className="text-xs text-destructive">{row.error}</p>
                      ) : null}
                      {row.videoId ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${row.videoId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Open on YouTube
                        </a>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground"
                      aria-label="Remove"
                      disabled={row.status === "uploading"}
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
