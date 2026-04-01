"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  PIPELINE_COLUMN_ORDER,
  PIPELINE_LABELS,
  type PipelineStatusValue,
} from "@/lib/pipeline-ui"
import type { PipelineItemDto } from "@/hooks/use-pipeline"
import {
  useCreatePipelineItem,
  useUpdatePipelineItem,
} from "@/hooks/use-pipeline"
import { toast } from "@/components/ui/toast"

function ymdFromIso(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export function PipelineItemDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial: PipelineItemDto | null
}) {
  const create = useCreatePipelineItem()
  const update = useUpdatePipelineItem()

  const [title, setTitle] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [status, setStatus] = React.useState<PipelineStatusValue>("BACKLOG")
  const [dueDate, setDueDate] = React.useState("")
  const [youtubeVideoId, setYoutubeVideoId] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    if (initial) {
      setTitle(initial.title)
      setNotes(initial.notes)
      setStatus(initial.status)
      setDueDate(ymdFromIso(initial.dueDate))
      setYoutubeVideoId(initial.youtubeVideoId ?? "")
    } else {
      setTitle("")
      setNotes("")
      setStatus("BACKLOG")
      setDueDate("")
      setYoutubeVideoId("")
    }
  }, [open, initial])

  if (!open) return null

  const busy = create.isPending || update.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (initial) {
      update.mutate(
        {
          id: initial.id,
          body: {
            title: title.trim(),
            notes,
            status,
            dueDate: dueDate.trim() === "" ? null : dueDate,
            youtubeVideoId: youtubeVideoId.trim() === "" ? null : youtubeVideoId.trim(),
          },
        },
        {
          onSuccess: () => {
            toast.success("Card updated.")
            onClose()
          },
          onError: (err: Error) => toast.error(err.message),
        }
      )
    } else {
      create.mutate(
        {
          title: title.trim(),
          notes,
          status,
          dueDate: dueDate.trim() === "" ? null : dueDate,
          youtubeVideoId: youtubeVideoId.trim() === "" ? null : youtubeVideoId.trim(),
        },
        {
          onSuccess: () => {
            toast.success("Card created.")
            onClose()
          },
          onError: (err: Error) => toast.error(err.message),
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 motion-reduce:transition-none animate-in fade-in-0"
        aria-label="Close"
        onClick={onClose}
      />
      <Card className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden shadow-xl motion-reduce:transition-none animate-in zoom-in-95 fade-in-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit card" : "New pipeline card"}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </Button>
        </div>
        <form
          className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <label htmlFor="pl-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="pl-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="pl-notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="pl-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="pl-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="pl-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as PipelineStatusValue)
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PIPELINE_COLUMN_ORDER.map((s) => (
                <option key={s} value={s}>
                  {PIPELINE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="pl-due" className="text-sm font-medium">
              Due date
            </label>
            <Input
              id="pl-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="pl-vid" className="text-sm font-medium">
              YouTube video ID (optional)
            </label>
            <Input
              id="pl-vid"
              placeholder="e.g. after publishing"
              value={youtubeVideoId}
              onChange={(e) => setYoutubeVideoId(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : initial ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
