"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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
import { ApiQuotaCard } from "@/components/help/api-quota-card"
import { useAiStatus, useOrgFeatures } from "@/hooks/use-org"
import { YOUTUBE_CATEGORY_OPTIONS } from "@/lib/youtube-categories"
import { queryKeys } from "@/lib/query-keys"
import { fileBasename, matchCsvToQueueRows, parseCsv } from "@/lib/csv-bulk"
import { MAX_BULK_METADATA_ITEMS } from "@/lib/gemini"
import {
  addVideoToPlaylist,
  fetchMyPlaylists,
  formatUploadErrorMessage,
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

type SeriesStepUnit = "minutes" | "hours" | "days" | "weeks"

/** `datetime-local` string in the user's local timezone. */
function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Nth slot: start + (index * stepValue) in the given unit. */
function slotAfterStart(
  start: Date,
  index: number,
  stepValue: number,
  unit: SeriesStepUnit
): Date {
  const d = new Date(start.getTime())
  const n = index * stepValue
  switch (unit) {
    case "minutes":
      d.setMinutes(d.getMinutes() + n)
      break
    case "hours":
      d.setHours(d.getHours() + n)
      break
    case "days":
      d.setDate(d.getDate() + n)
      break
    case "weeks":
      d.setDate(d.getDate() + n * 7)
      break
  }
  return d
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
  const aiStatus = useAiStatus()
  const writesOk = features.data?.youtube_writes ?? true
  const qc = useQueryClient()

  const playlistsQ = useQuery({
    queryKey: ["youtube", "playlists", "mine"],
    queryFn: fetchMyPlaylists,
  })

  const templatesQ = useQuery({
    queryKey: queryKeys.metadataTemplates,
    queryFn: async () => {
      const res = await fetch("/api/orgs/current/metadata-templates")
      const data = (await res.json()) as {
        error?: string
        templates?: Array<{
          id: string
          name: string
          title: string | null
          description: string | null
          tags: string | null
          categoryId: string | null
          visibility: string | null
        }>
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to load templates")
      return data.templates ?? []
    },
  })

  const [queue, setQueue] = React.useState<QueueRow[]>([])
  const [tagsRaw, setTagsRaw] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("22")
  const [madeForKids, setMadeForKids] = React.useState(false)
  const [playlistId, setPlaylistId] = React.useState("")
  const [running, setRunning] = React.useState(false)
  const [dragId, setDragId] = React.useState<string | null>(null)

  const [seriesStart, setSeriesStart] = React.useState("")
  const [seriesStep, setSeriesStep] = React.useState("1")
  const [seriesUnit, setSeriesUnit] = React.useState<SeriesStepUnit>("days")

  const [templateName, setTemplateName] = React.useState("")
  const [templateSelectId, setTemplateSelectId] = React.useState("")

  const [aiContext, setAiContext] = React.useState("")
  const [aiFillEmptyOnly, setAiFillEmptyOnly] = React.useState(true)
  const [aiOverwriteTitles, setAiOverwriteTitles] = React.useState(false)
  const [aiSuggestBusy, setAiSuggestBusy] = React.useState(false)

  const folderInputRef = React.useRef<HTMLInputElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const csvInputRef = React.useRef<HTMLInputElement>(null)

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

  const applySelectedTemplate = () => {
    const t = templatesQ.data?.find((x) => x.id === templateSelectId)
    if (!t) {
      toast.error("Pick a saved template.")
      return
    }
    if (t.tags) setTagsRaw(t.tags)
    if (t.categoryId) setCategoryId(t.categoryId)
    toast.success(`Applied "${t.name}" to shared tags and category.`)
  }

  const saveTemplate = async () => {
    const name = templateName.trim()
    if (!name) {
      toast.error("Enter a template name.")
      return
    }
    try {
      const res = await fetch("/api/orgs/current/metadata-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tags: tagsRaw || null,
          categoryId: categoryId || null,
          title: null,
          description: null,
          visibility: null,
        }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Save failed"
        throw new Error(msg)
      }
      setTemplateName("")
      toast.success("Template saved.")
      await qc.invalidateQueries({ queryKey: queryKeys.metadataTemplates })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  const onCsvPicked = async (list: FileList | null) => {
    const f = list?.[0]
    if (!f) return
    try {
      const text = await f.text()
      const { headers, rows } = parseCsv(text)
      if (!headers.length) {
        toast.error("CSV is empty.")
        return
      }
      const hasFileCol = ["filename", "file", "path"].some((k) =>
        headers.includes(k)
      )
      if (!hasFileCol) {
        toast.error(
          "CSV needs a filename column (filename, file, or path) to match rows."
        )
        return
      }
      setQueue((q) => {
        const next = matchCsvToQueueRows(q, rows)
        const changed = next.filter((r, i) => r !== q[i]).length
        if (!changed) {
          queueMicrotask(() =>
            toast.error("No queue rows matched CSV filenames.")
          )
          return q
        }
        queueMicrotask(() =>
          toast.success(`Updated ${changed} row(s) from CSV.`)
        )
        return next
      })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not read CSV")
    }
    if (csvInputRef.current) csvInputRef.current.value = ""
  }

  const runAiMetadataSuggest = async () => {
    const pending = queue.filter(
      (r) => r.status === "queued" || r.status === "error"
    )
    const batch = pending.slice(0, MAX_BULK_METADATA_ITEMS)
    if (!batch.length) {
      toast.error("Add queued videos first (skip in-progress or finished rows).")
      return
    }
    setAiSuggestBusy(true)
    try {
      const res = await fetch("/api/ai/bulk-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: aiContext.trim() || undefined,
          items: batch.map((r) => ({
            id: r.id,
            basename: fileBasename(r.sortPath),
            title: r.title.trim() || undefined,
          })),
        }),
      })
      const data = (await res.json()) as {
        error?: string
        suggestions?: Array<{
          id: string
          title: string
          description: string
          tags?: string
        }>
      }
      if (!res.ok) {
        throw new Error(data.error ?? "AI request failed")
      }
      const suggestions = data.suggestions ?? []
      setQueue((q) =>
        q.map((row) => {
          const s = suggestions.find((x) => x.id === row.id)
          if (!s) return row
          const nextTitle =
            aiOverwriteTitles || !row.title.trim()
              ? s.title.slice(0, 100)
              : row.title
          const nextDesc =
            aiFillEmptyOnly && row.description.trim()
              ? row.description
              : s.description.slice(0, 5000)
          return { ...row, title: nextTitle, description: nextDesc }
        })
      )
      setTagsRaw((prev) => {
        if (prev.trim()) return prev
        const allTags = new Set<string>()
        for (const s of suggestions) {
          for (const t of (s.tags ?? "").split(",")) {
            const x = t.trim()
            if (x) allTags.add(x)
          }
        }
        if (!allTags.size) return prev
        return [...allTags].slice(0, 30).join(", ")
      })
      toast.success(
        `Applied AI drafts to ${suggestions.length} row(s). Review before uploading.`
      )
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI request failed")
    } finally {
      setAiSuggestBusy(false)
    }
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

  const applyStaggeredSchedules = () => {
    const eligible = queue.filter(
      (r) => r.status !== "done" && r.status !== "uploading"
    ).length
    if (!eligible) {
      toast.error(
        "No rows to update (finished or in-progress uploads are skipped)."
      )
      return
    }
    if (!seriesStart.trim()) {
      toast.error("Pick a start date and time for the first video in the queue.")
      return
    }
    const start = new Date(seriesStart)
    if (Number.isNaN(start.getTime())) {
      toast.error("Invalid start date.")
      return
    }
    if (start.getTime() < Date.now() + 60_000) {
      toast.error("Start time must be at least one minute from now.")
      return
    }
    const step = Math.floor(Number(seriesStep))
    if (!Number.isFinite(step) || step < 1) {
      toast.error("Step must be a whole number of 1 or more.")
      return
    }

    setQueue((q) => {
      let idx = 0
      return q.map((row) => {
        if (row.status === "done" || row.status === "uploading") return row
        const slot = slotAfterStart(start, idx, step, seriesUnit)
        idx++
        return {
          ...row,
          visibility: "schedule",
          scheduleLocal: formatDatetimeLocal(slot),
        }
      })
    })
    toast.success(
      `Set "Schedule public" with staggered times for ${eligible} video(s) (queue order).`
    )
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
        const msg = formatUploadErrorMessage(e)
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

      {writesOk ? <ApiQuotaCard /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Shared for all videos in the queue</CardTitle>
          <CardDescription>
            Tags, category, and made-for-kids apply to every row. Each row has
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
          <CardTitle>Workspace templates &amp; CSV</CardTitle>
          <CardDescription>
            Save shared tags and category as a reusable preset, or import a CSV
            to fill titles, descriptions, visibility, and schedule per file. Match
            rows using a <span className="font-mono">filename</span>,{" "}
            <span className="font-mono">file</span>, or{" "}
            <span className="font-mono">path</span> column (basename match).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="bu-tpl-sel">
                Saved template
              </label>
              <select
                id="bu-tpl-sel"
                value={templateSelectId}
                onChange={(e) => setTemplateSelectId(e.target.value)}
                disabled={templatesQ.isLoading || !writesOk}
                className="h-10 w-full min-w-[12rem] rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— Select —</option>
                {(templatesQ.data ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={!writesOk || !templateSelectId}
              onClick={applySelectedTemplate}
            >
              Apply to shared fields
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <Input
              placeholder="New template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={!writesOk}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!writesOk}
              onClick={() => void saveTemplate()}
            >
              Save current tags &amp; category
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => void onCsvPicked(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!writesOk || !queue.length}
              onClick={() => csvInputRef.current?.click()}
            >
              Import CSV into queue
            </Button>
            <p className="text-xs text-muted-foreground">
              Optional columns: title, description, schedule, visibility.
            </p>
          </div>
        </CardContent>
      </Card>

      {writesOk && aiStatus.data?.allowed ? (
        <Card>
          <CardHeader>
            <CardTitle>AI metadata suggestions (Gemini)</CardTitle>
            <CardDescription>
              Draft titles and descriptions for up to {MAX_BULK_METADATA_ITEMS}{" "}
              queued rows at a time. Enable in Settings (workspace + your
              opt-in). Always review before upload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="bu-ai-ctx"
              >
                Optional context (channel niche, series, tone)
              </label>
              <textarea
                id="bu-ai-ctx"
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value.slice(0, 2000))}
                rows={3}
                placeholder="e.g. Retro gaming reviews, casual tone, no spoilers in title…"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={aiFillEmptyOnly}
                  onChange={(e) => setAiFillEmptyOnly(e.target.checked)}
                />
                Only replace empty descriptions
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={aiOverwriteTitles}
                  onChange={(e) => setAiOverwriteTitles(e.target.checked)}
                />
                Overwrite titles with AI
              </label>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={aiSuggestBusy || running}
              onClick={() => void runAiMetadataSuggest()}
              className="gap-2"
            >
              {aiSuggestBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Suggest for queued rows"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Staggered public release</CardTitle>
          <CardDescription>
            Pick when the first video in the queue should go public, then a step
            (every N minutes, hours, days, or weeks). Click apply to set{" "}
            <strong>Schedule public</strong> times for each pending row in
            current order. Reorder the queue first if needed. Finished or
            in-progress uploads are skipped. You can still edit individual rows
            afterward.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="bu-series-start">
                First video goes public at
              </label>
              <Input
                id="bu-series-start"
                type="datetime-local"
                value={seriesStart}
                onChange={(e) => setSeriesStart(e.target.value)}
                className="h-10 w-full max-w-[14rem]"
              />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="bu-series-step">
                  Then every
                </label>
                <Input
                  id="bu-series-step"
                  type="number"
                  min={1}
                  step={1}
                  value={seriesStep}
                  onChange={(e) => setSeriesStep(e.target.value)}
                  className="h-10 w-20"
                />
              </div>
              <div className="space-y-2">
                <label className="sr-only" htmlFor="bu-series-unit">
                  Time unit
                </label>
                <select
                  id="bu-series-unit"
                  value={seriesUnit}
                  onChange={(e) =>
                    setSeriesUnit(e.target.value as SeriesStepUnit)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={applyStaggeredSchedules}
            >
              Apply to queue
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Example: start Monday 9:00, every 1 days → daily slots. Every 6
            hours → four videos per day in order.
          </p>
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
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs text-destructive">{row.error}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={running}
                            onClick={() =>
                              updateRow(row.id, {
                                status: "queued",
                                progress: 0,
                                error: undefined,
                              })
                            }
                          >
                            Retry upload
                          </Button>
                        </div>
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
