"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Trash2,
  FolderOpen,
  UploadCloud,
} from "lucide-react"
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
  /** Folder-relative path or filename (for ordering context). */
  sortPath: string
  title: string
  description: string
  visibility: VisibilityMode
  scheduleLocal: string
  status: "queued" | "uploading" | "done" | "error"
  progress: number
  error?: string
  videoId?: string
}

function isProbablyVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true
  return /\.(mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|wmv|3gp)$/i.test(file.name)
}

function sortFilesByPath(files: File[]): File[] {
  return [...files].sort((a, b) => {
    const pa = (a as File & { webkitRelativePath?: string }).webkitRelativePath || a.name
    const pb = (b as File & { webkitRelativePath?: string }).webkitRelativePath || b.name
    return pa.localeCompare(pb, undefined, { numeric: true, sensitivity: "base" })
  })
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30)
}

function rowSortPath(file: File): string {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
}

function resolveRowPublish(
  visibility: VisibilityMode,
  scheduleLocal: string,
  label: string
): Pick<YoutubeUploadInitPayload, "privacyStatus" | "publishAt"> {
  if (visibility === "private") {
    return { privacyStatus: "private", publishAt: null }
  }
  if (visibility === "unlisted") {
    return { privacyStatus: "unlisted", publishAt: null }
  }
  if (visibility === "schedule") {
    if (!scheduleLocal.trim()) {
      throw new Error(`Schedule date/time required for "${label}".`)
    }
    const when = new Date(scheduleLocal)
    if (Number.isNaN(when.getTime())) {
      throw new Error(`Invalid schedule for "${label}".`)
    }
    if (when.getTime() < Date.now() + 60_000) {
      throw new Error(
        `"${label}": schedule must be at least one minute from now.`
      )
    }
    return { privacyStatus: "private", publishAt: when.toISOString() }
  }
  return { privacyStatus: "public", publishAt: null }
}

export function BulkUploadForm() {
  const features = useOrgFeatures()
  const writesOk = features.data?.youtube_writes ?? true

  const playlistsQ = useQuery({
    queryKey: ["youtube", "playlists", "mine"],
    queryFn: fetchMyPlaylists,
  })

  const [queue, setQueue] = React.useState<QueueRow[]>([])
  const [tagsRaw, setTagsRaw] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("22")
  const [madeForKids, setMadeForKids] = React.useState(false)
  const [playlistId, setPlaylistId] = React.useState("")
  const [running, setRunning] = React.useState(false)
  const [dragId, setDragId] = React.useState<string | null>(null)

  const folderInputRef = React.useRef<HTMLInputElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const fileToRow = (file: File): QueueRow => ({
    id: randomId(),
    file,
    sortPath: rowSortPath(file),
    title: stripExtension(file.name).slice(0, 100),
    description: "",
    visibility: "public",
    scheduleLocal: "",
    status: "queued",
    progress: 0,
  })

  const addFilesFromList = (list: FileList | null, fromFolder: boolean) => {
    if (!list?.length) return
    const raw = Array.from(list).filter(isProbablyVideoFile)
    if (!raw.length) {
      toast.error("No supported video files found.")
      return
    }
    const sorted = fromFolder ? sortFilesByPath(raw) : sortFilesByPath(raw)
    const skipped = list.length - raw.length
    if (skipped > 0) {
      toast.success(`Skipped ${skipped} non-video file(s).`)
    }
    const rows = sorted.map(fileToRow)
    setQueue((q) => [...q, ...rows])
    toast.success(
      `Added ${rows.length} video(s)${fromFolder ? " (sorted by path)" : ""}.`
    )
  }

  const updateRow = (id: string, patch: Partial<QueueRow>) => {
    setQueue((q) => q.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const moveRow = (id: string, dir: -1 | 1) => {
    setQueue((q) => {
      const i = q.findIndex((r) => r.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= q.length) return q
      const n = [...q]
      const t = n[i]!
      n[i] = n[j]!
      n[j] = t
      return n
    })
  }

  const removeRow = (id: string) => {
    setQueue((q) => q.filter((r) => r.id !== id))
  }

  const clearDone = () => {
    setQueue((q) => q.filter((r) => r.status !== "done"))
  }

  const clearQueue = () => {
    if (queue.some((r) => r.status === "uploading")) return
    setQueue([])
  }

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const fromId = dragId ?? e.dataTransfer.getData("text/plain")
    setDragId(null)
    if (!fromId || fromId === targetId) return
    setQueue((q) => {
      const from = q.findIndex((r) => r.id === fromId)
      const to = q.findIndex((r) => r.id === targetId)
      if (from < 0 || to < 0) return q
      const n = [...q]
      const [item] = n.splice(from, 1)
      n.splice(to, 0, item!)
      return n
    })
  }

  const runQueue = async () => {
    if (!writesOk) {
      toast.error("YouTube writes are disabled for this workspace.")
      return
    }
    if (!queue.length) {
      toast.error("Add files or a folder first.")
      return
    }

    const tags = parseTags(tagsRaw)
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

      const label = row.title.trim() || stripExtension(row.file.name).slice(0, 100)

      try {
        if (!label) throw new Error("Title required.")

        let pub: Pick<YoutubeUploadInitPayload, "privacyStatus" | "publishAt">
        try {
          pub = resolveRowPublish(row.visibility, row.scheduleLocal, label)
        } catch (err: unknown) {
          throw err instanceof Error ? err : new Error(String(err))
        }

        const { id } = await uploadLocalFileToYoutube(
          row.file,
          {
            title: label.slice(0, 100),
            description: row.description.trim() || undefined,
            tags: tags.length ? tags : undefined,
            categoryId,
            privacyStatus: pub.privacyStatus,
            publishAt: pub.publishAt,
            selfDeclaredMadeForKids: madeForKids,
          },
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
                ? `Uploaded "${label}" but playlist failed: ${e.message}`
                : "Playlist add failed."
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
        toast.success(`Uploaded: ${label}`)
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
              cannot upload. Check Settings or Team.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Shared for all videos in the queue</CardTitle>
          <CardDescription>
            Tags, category, and “made for kids” apply to every row. Each row has
            its own title, description, visibility, and optional schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={madeForKids}
                onChange={(e) => setMadeForKids(e.target.checked)}
              />
              Made for kids (all uploads in this batch)
            </label>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="bu-pl">
                Add each uploaded video to playlist (optional)
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
                Choose a folder (sorted by path) or add individual files. Drag
                the handle or use arrows to reorder. Max 20 GB per file.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={folderInputRef}
                type="file"
                multiple
                {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
                className="hidden"
                onChange={(e) => {
                  addFilesFromList(e.target.files, true)
                  e.target.value = ""
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  addFilesFromList(e.target.files, false)
                  e.target.value = ""
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!writesOk}
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderOpen className="size-4" />
                Add folder
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!writesOk}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="size-4" />
                Add files
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearQueue}
                disabled={
                  !queue.length || queue.some((r) => r.status === "uploading")
                }
              >
                Clear queue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No videos in the queue. Use “Add folder” or “Add files”.
            </p>
          ) : (
            <ul className="space-y-4">
              {queue.map((row) => (
                <li
                  key={row.id}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, row.id)}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div className="flex gap-2">
                    <div
                      draggable={row.status !== "uploading"}
                      onDragStart={(e) => onDragStart(e, row.id)}
                      onDragEnd={() => setDragId(null)}
                      className="flex shrink-0 flex-col items-center gap-1 pt-1 text-muted-foreground"
                      title="Drag handle — reorder queue"
                    >
                      <GripVertical className="size-4 cursor-grab active:cursor-grabbing" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Move up"
                        disabled={row.status === "uploading"}
                        onClick={() => moveRow(row.id, -1)}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Move down"
                        disabled={row.status === "uploading"}
                        onClick={() => moveRow(row.id, 1)}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {row.sortPath} · {(row.file.size / (1024 * 1024)).toFixed(1)}{" "}
                        MB
                      </p>
                      <Input
                        value={row.title}
                        onChange={(e) =>
                          updateRow(row.id, {
                            title: e.target.value.slice(0, 100),
                          })
                        }
                        maxLength={100}
                        disabled={row.status === "uploading"}
                        placeholder="Title"
                      />
                      <div className="space-y-1">
                        <label
                          className="text-xs font-medium text-muted-foreground"
                          htmlFor={`desc-${row.id}`}
                        >
                          Description
                        </label>
                        <textarea
                          id={`desc-${row.id}`}
                          value={row.description}
                          onChange={(e) =>
                            updateRow(row.id, {
                              description: e.target.value.slice(0, 5000),
                            })
                          }
                          rows={2}
                          maxLength={5000}
                          disabled={row.status === "uploading"}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Visibility
                          </span>
                          <select
                            value={row.visibility}
                            onChange={(e) =>
                              updateRow(row.id, {
                                visibility: e.target
                                  .value as VisibilityMode,
                              })
                            }
                            disabled={row.status === "uploading"}
                            className="h-9 w-full min-w-[10rem] rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="schedule">Schedule public</option>
                          </select>
                        </div>
                        {row.visibility === "schedule" ? (
                          <Input
                            type="datetime-local"
                            value={row.scheduleLocal}
                            onChange={(e) =>
                              updateRow(row.id, {
                                scheduleLocal: e.target.value,
                              })
                            }
                            disabled={row.status === "uploading"}
                            className="h-9 w-full max-w-[14rem] text-xs sm:w-auto"
                          />
                        ) : null}
                      </div>
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
