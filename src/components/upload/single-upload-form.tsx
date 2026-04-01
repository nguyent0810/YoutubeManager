"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Upload } from "lucide-react"
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

type VisibilityMode = "public" | "private" | "unlisted" | "schedule"

function buildPayload(args: {
  title: string
  description: string
  tagsRaw: string
  categoryId: string
  visibility: VisibilityMode
  scheduleLocal: string
  madeForKids: boolean
  file: File
}): YoutubeUploadInitPayload {
  const tags = args.tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30)

  let privacyStatus: YoutubeUploadInitPayload["privacyStatus"] = "public"
  let publishAt: string | null | undefined

  if (args.visibility === "private") privacyStatus = "private"
  else if (args.visibility === "unlisted") privacyStatus = "unlisted"
  else if (args.visibility === "schedule") {
    if (!args.scheduleLocal.trim()) {
      throw new Error("Pick a date and time for scheduled publishing.")
    }
    const when = new Date(args.scheduleLocal)
    if (Number.isNaN(when.getTime())) throw new Error("Invalid schedule date.")
    if (when.getTime() < Date.now() + 60_000) {
      throw new Error("Schedule time must be at least one minute from now.")
    }
    privacyStatus = "private"
    publishAt = when.toISOString()
  } else {
    privacyStatus = "public"
    publishAt = undefined
  }

  const contentType = args.file.type?.trim() || "application/octet-stream"

  return {
    title: args.title.trim().slice(0, 100),
    description: args.description.trim() || undefined,
    tags: tags.length ? tags : undefined,
    categoryId: args.categoryId,
    privacyStatus,
    publishAt: publishAt ?? null,
    selfDeclaredMadeForKids: args.madeForKids,
    contentLength: args.file.size,
    contentType,
  }
}

export function SingleUploadForm() {
  const features = useOrgFeatures()
  const writesOk = features.data?.youtube_writes ?? true

  const playlistsQ = useQuery({
    queryKey: ["youtube", "playlists", "mine"],
    queryFn: fetchMyPlaylists,
  })

  const fileRef = React.useRef<HTMLInputElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [tagsRaw, setTagsRaw] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("22")
  const [visibility, setVisibility] = React.useState<VisibilityMode>("public")
  const [scheduleLocal, setScheduleLocal] = React.useState("")
  const [madeForKids, setMadeForKids] = React.useState(false)
  const [playlistId, setPlaylistId] = React.useState("")
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  const onPickFile = (list: FileList | null) => {
    const f = list?.[0]
    if (!f) return
    if (f.size <= 0) {
      toast.error("File is empty.")
      return
    }
    if (f.size > 20 * 1024 * 1024 * 1024) {
      toast.error("File is over 20 GB.")
      return
    }
    setFile(f)
    setTitle((t) => t.trim() || stripExtension(f.name).slice(0, 100))
  }

  const submit = async () => {
    if (!writesOk) {
      toast.error("YouTube writes are disabled for this workspace.")
      return
    }
    if (!file) {
      toast.error("Choose a video file.")
      return
    }
    const t = title.trim() || stripExtension(file.name).slice(0, 100)
    if (!t) {
      toast.error("Title is required.")
      return
    }

    let payload: YoutubeUploadInitPayload
    try {
      payload = buildPayload({
        title: t,
        description,
        tagsRaw,
        categoryId,
        visibility,
        scheduleLocal,
        madeForKids,
        file,
      })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invalid options")
      return
    }

    setUploading(true)
    setProgress(0)
    try {
      const { id } = await uploadLocalFileToYoutube(
        file,
        {
          title: payload.title,
          description: payload.description,
          tags: payload.tags,
          categoryId: payload.categoryId,
          privacyStatus: payload.privacyStatus,
          publishAt: payload.publishAt,
          selfDeclaredMadeForKids: payload.selfDeclaredMadeForKids,
        },
        setProgress
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
      toast.success("Video uploaded.")
      setFile(null)
      setTitle("")
      setDescription("")
      setProgress(0)
      if (fileRef.current) fileRef.current.value = ""
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
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
          <CardTitle>Video file</CardTitle>
          <CardDescription>
            One file at a time. Same resumable flow as bulk upload (chunked
            through the server).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              onPickFile(e.target.files)
              e.target.value = ""
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!writesOk || uploading}
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              <Upload className="size-4" />
              Choose file
            </Button>
            {file ? (
              <span className="text-sm text-muted-foreground">
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                No file selected
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="su-title">
              Title
            </label>
            <Input
              id="su-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              maxLength={100}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="su-desc">
              Description
            </label>
            <textarea
              id="su-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              disabled={uploading}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="su-tags">
                Tags (comma-separated)
              </label>
              <Input
                id="su-tags"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="su-cat">
                Category
              </label>
              <select
                id="su-cat"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={uploading}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {YOUTUBE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Visibility</span>
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="su-vis"
                  checked={visibility === "public"}
                  disabled={uploading}
                  onChange={() => setVisibility("public")}
                />
                Public when upload completes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="su-vis"
                  checked={visibility === "private"}
                  disabled={uploading}
                  onChange={() => setVisibility("private")}
                />
                Private
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="su-vis"
                  checked={visibility === "unlisted"}
                  disabled={uploading}
                  onChange={() => setVisibility("unlisted")}
                />
                Unlisted
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="su-vis"
                  checked={visibility === "schedule"}
                  disabled={uploading}
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
                disabled={uploading}
                className="max-w-xs"
              />
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={madeForKids}
              disabled={uploading}
              onChange={(e) => setMadeForKids(e.target.checked)}
            />
            Made for kids
          </label>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="su-pl">
              Add to playlist (optional)
            </label>
            <select
              id="su-pl"
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              disabled={uploading || playlistsQ.isLoading}
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

          {uploading ? (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width] motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Uploading…</p>
            </div>
          ) : null}

          <Button
            type="button"
            disabled={!writesOk || uploading || !file}
            onClick={() => void submit()}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Upload to YouTube"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
