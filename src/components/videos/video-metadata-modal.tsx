"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { queryKeys } from "@/lib/query-keys"
import {
  fetchVideoById,
  patchVideoMetadata,
} from "@/lib/youtube-client"
import { toast } from "@/components/ui/toast"

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  tags: z.string(),
})

type FormValues = z.infer<typeof schema>

export function VideoMetadataModal({
  videoId,
  open,
  onClose,
}: {
  videoId: string | null
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const videoQuery = useQuery({
    queryKey: queryKeys.video(videoId ?? undefined),
    queryFn: () => fetchVideoById(videoId!),
    enabled: open && !!videoId,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", tags: "" },
  })

  React.useEffect(() => {
    const v = videoQuery.data
    if (!v) return
    form.reset({
      title: v.snippet.title,
      description: v.snippet.description ?? "",
      tags: (v.snippet.tags ?? []).join(", "),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when loaded video changes
  }, [videoQuery.data])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!videoId) throw new Error("No video")
      const tags = values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      return patchVideoMetadata(videoId, {
        title: values.title,
        description: values.description,
        tags,
      })
    },
    onSuccess: async () => {
      toast.success("Video details saved.")
      await queryClient.invalidateQueries({ queryKey: ["youtube", "videos"] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.channel })
      if (videoId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.video(videoId),
        })
      }
      onClose()
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  if (!open) return null
  if (!videoId) return null

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
          <h2 className="text-lg font-semibold">Edit metadata</h2>
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
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
          onSubmit={form.handleSubmit((vals) => mutation.mutate(vals))}
        >
          {videoQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading video…</p>
          ) : videoQuery.isError ? (
            <p className="text-sm text-destructive">
              {videoQuery.error instanceof Error
                ? videoQuery.error.message
                : "Failed to load"}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="vm-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="vm-title"
                  {...form.register("title")}
                  aria-invalid={!!form.formState.errors.title}
                />
                {form.formState.errors.title ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="vm-desc" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="vm-desc"
                  rows={6}
                  {...form.register("description")}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="vm-tags" className="text-sm font-medium">
                  Tags
                </label>
                <Input
                  id="vm-tags"
                  placeholder="comma separated"
                  {...form.register("tags")}
                />
                <p className="text-xs text-muted-foreground">
                  Separate tags with commas.
                </p>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending || videoQuery.isLoading || !videoQuery.data
              }
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
