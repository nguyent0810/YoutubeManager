"use client"

import * as React from "react"
import { useQueries } from "@tanstack/react-query"
import Link from "next/link"
import { Download, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PIPELINE_COLUMN_ORDER,
  PIPELINE_LABELS,
  type PipelineStatusValue,
} from "@/lib/pipeline-ui"
import type { PipelineItemDto } from "@/hooks/use-pipeline"
import {
  useDeletePipelineItem,
  usePipeline,
  useUpdatePipelineItem,
} from "@/hooks/use-pipeline"
import { PipelineItemDialog } from "@/components/pipeline/pipeline-item-dialog"
import { toast } from "@/components/ui/toast"
import { useOrgCurrent, useOrgFeatures } from "@/hooks/use-org"
import { orgRoleAtLeast } from "@/lib/org-role"
import { queryKeys } from "@/lib/query-keys"
import { fetchVideoById } from "@/lib/youtube-client"
import type { YouTubeVideo } from "@/types/youtube"

function formatDue(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function PipelineCard({
  item,
  onEdit,
  canMutate,
  video,
  videoLoading,
  videoError,
}: {
  item: PipelineItemDto
  onEdit: () => void
  canMutate: boolean
  video?: YouTubeVideo | null
  videoLoading?: boolean
  videoError?: boolean
}) {
  const del = useDeletePipelineItem()
  const update = useUpdatePipelineItem()

  const changeStatus = (next: PipelineStatusValue) => {
    if (next === item.status) return
    update.mutate(
      { id: item.id, body: { status: next } },
      { onError: (e: Error) => toast.error(e.message) }
    )
  }

  const thumb =
    video?.snippet.thumbnails?.medium?.url ??
    video?.snippet.thumbnails?.default?.url

  return (
    <div className="rounded-md border border-border bg-background p-3 shadow-sm">
      <p className="font-medium leading-snug">{item.title}</p>
      {item.notes ? (
        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
          {item.notes}
        </p>
      ) : null}
      {item.youtubeVideoId ? (
        <div className="mt-2 space-y-2">
          {videoLoading ? (
            <p className="text-[10px] text-muted-foreground">Loading video…</p>
          ) : videoError ? (
            <p className="text-[10px] text-destructive">
              Could not load YouTube metadata for this id.
            </p>
          ) : video ? (
            <div className="flex gap-2">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded border border-border bg-muted object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1 text-[10px] text-muted-foreground">
                <p className="line-clamp-2 font-medium text-foreground">
                  {video.snippet.title}
                </p>
                {video.statistics?.viewCount ? (
                  <p>{Number(video.statistics.viewCount).toLocaleString()} views</p>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                  <Link
                    href={`https://www.youtube.com/watch?v=${item.youtubeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Watch <ExternalLink className="size-3" />
                  </Link>
                  <Link
                    href={`https://studio.youtube.com/video/${item.youtubeVideoId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Studio <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground">
              {item.youtubeVideoId}
            </span>
          )}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        {formatDue(item.dueDate) ? (
          <span>Due {formatDue(item.dueDate)}</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={item.status}
          onChange={(e) =>
            changeStatus(e.target.value as PipelineStatusValue)
          }
          disabled={!canMutate}
          className="h-8 max-w-full flex-1 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
          aria-label="Move to column"
        >
          {PIPELINE_COLUMN_ORDER.map((s) => (
            <option key={s} value={s}>
              {PIPELINE_LABELS[s]}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 shrink-0"
          onClick={onEdit}
          aria-label={canMutate ? "Edit" : "View"}
        >
          <Pencil className="size-3.5" />
        </Button>
        {canMutate ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-destructive"
            aria-label="Delete"
            onClick={() => {
              if (!window.confirm("Delete this card?")) return
              del.mutate(item.id, {
                onError: (e: Error) => toast.error(e.message),
              })
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function PipelineBoard() {
  const query = usePipeline()
  const orgQ = useOrgCurrent()
  const featuresQ = useOrgFeatures()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<PipelineItemDto | null>(null)

  const canMutate = orgRoleAtLeast(orgQ.data?.activeRole, "MEMBER")

  const exportCsv = async () => {
    try {
      const res = await fetch("/api/pipeline/export")
      const ct = res.headers.get("Content-Type") ?? ""
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null)
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Export failed"
        toast.error(msg)
        return
      }
      if (!ct.includes("text/csv")) {
        toast.error("Unexpected export response")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const disp = res.headers.get("Content-Disposition")
      const m = disp?.match(/filename="([^"]+)"/)
      a.download = m?.[1] ?? "pipeline-export.csv"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Download started.")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Export failed")
    }
  }

  const byStatus = React.useMemo(() => {
    const items = query.data ?? []
    const m = new Map<PipelineStatusValue, PipelineItemDto[]>()
    for (const s of PIPELINE_COLUMN_ORDER) m.set(s, [])
    for (const it of items) {
      const list = m.get(it.status)
      if (list) list.push(it)
    }
    return m
  }, [query.data])

  const videoIds = React.useMemo(() => {
    const items = query.data ?? []
    const s = new Set<string>()
    for (const it of items) {
      if (it.youtubeVideoId) s.add(it.youtubeVideoId)
    }
    return [...s]
  }, [query.data])

  const videoQueries = useQueries({
    queries: videoIds.map((id) => ({
      queryKey: queryKeys.video(id),
      queryFn: () => fetchVideoById(id),
      staleTime: 60_000,
    })),
  })

  const videoMetaById = React.useMemo(() => {
    const m = new Map<
      string,
      { data?: YouTubeVideo; isLoading: boolean; isError: boolean }
    >()
    videoIds.forEach((id, i) => {
      const q = videoQueries[i]
      m.set(id, {
        data: q?.data,
        isLoading: q?.isLoading ?? false,
        isError: q?.isError ?? false,
      })
    })
    return m
  }, [videoIds, videoQueries])

  if (query.isError) {
    const msg =
      query.error instanceof Error ? query.error.message : "Failed to load"
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{msg}</p>
          <p className="mt-2">
            Add <code className="rounded bg-muted px-1">DATABASE_URL</code> and
            run{" "}
            <code className="rounded bg-muted px-1">
              npx prisma migrate deploy
            </code>
            .
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Drag-free workflow: move cards with the status dropdown or open to
          edit details.
        </p>
        <div className="flex flex-wrap gap-2">
          {featuresQ.data?.exports ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => void exportCsv()}
            >
              <Download className="size-4" /> Export CSV
            </Button>
          ) : null}
          {canMutate ? (
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditItem(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="size-4" /> New card
            </Button>
          ) : null}
        </div>
      </div>

      {query.isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_COLUMN_ORDER.map((col) => (
            <div
              key={col}
              className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {PIPELINE_LABELS[col]}
                <span className="ml-1.5 font-normal text-foreground">
                  ({byStatus.get(col)?.length ?? 0})
                </span>
              </h3>
              <div className="flex max-h-[min(70vh,560px)] flex-col gap-2 overflow-y-auto pr-1">
                {(byStatus.get(col) ?? []).map((item) => {
                  const vid = item.youtubeVideoId
                  const vm = vid ? videoMetaById.get(vid) : undefined
                  return (
                    <PipelineCard
                      key={item.id}
                      item={item}
                      canMutate={canMutate}
                      video={vm?.data ?? null}
                      videoLoading={vid ? (vm?.isLoading ?? false) : false}
                      videoError={vid ? (vm?.isError ?? false) : false}
                      onEdit={() => {
                        setEditItem(item)
                        setDialogOpen(true)
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <PipelineItemDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditItem(null)
        }}
        initial={editItem}
        canEdit={canMutate}
      />
    </>
  )
}
