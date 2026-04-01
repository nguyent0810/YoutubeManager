"use client"

import * as React from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
}: {
  item: PipelineItemDto
  onEdit: () => void
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

  return (
    <div className="rounded-md border border-border bg-background p-3 shadow-sm">
      <p className="font-medium leading-snug">{item.title}</p>
      {item.notes ? (
        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
          {item.notes}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        {formatDue(item.dueDate) ? (
          <span>Due {formatDue(item.dueDate)}</span>
        ) : null}
        {item.youtubeVideoId ? (
          <span className="font-mono">{item.youtubeVideoId}</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={item.status}
          onChange={(e) =>
            changeStatus(e.target.value as PipelineStatusValue)
          }
          className="h-8 max-w-full flex-1 rounded-md border border-input bg-background px-2 text-xs"
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
          aria-label="Edit"
        >
          <Pencil className="size-3.5" />
        </Button>
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
      </div>
    </div>
  )
}

export function PipelineBoard() {
  const query = usePipeline()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<PipelineItemDto | null>(null)

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
                {(byStatus.get(col) ?? []).map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onEdit={() => {
                      setEditItem(item)
                      setDialogOpen(true)
                    }}
                  />
                ))}
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
      />
    </>
  )
}
