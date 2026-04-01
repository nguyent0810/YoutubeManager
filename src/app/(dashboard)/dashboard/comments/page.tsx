"use client"

import * as React from "react"
import { useChannel } from "@/hooks/use-channel"
import { useVideos } from "@/hooks/use-videos"
import { CommentThreadsList } from "@/components/comments/comment-threads-list"
import { SavedRepliesPanel } from "@/components/comments/saved-replies-panel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "@/components/ui/toast"

export default function CommentsPage() {
  const [videoId, setVideoId] = React.useState<string | null>(null)

  const channelQuery = useChannel()
  const channelId = channelQuery.data?.id

  const videosQuery = useVideos(channelId, { order: "date" })
  const videos = React.useMemo(
    () => videosQuery.data?.pages.flatMap((p) => p.videos) ?? [],
    [videosQuery.data]
  )

  const loading =
    channelQuery.isLoading ||
    (videosQuery.isLoading && !!channelId && !videosQuery.data)

  if (channelQuery.isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p className="font-medium text-destructive">Channel unavailable</p>
          <Button type="button" variant="link" className="mt-2 h-auto p-0" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
        <p className="text-sm text-muted-foreground">
          Read threads on a video and reply from here. Saved replies use your
          database (Postgres); paste them into a reply box after clicking “Use”.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Video</span>
          <select
            value={videoId ?? ""}
            onChange={(e) => setVideoId(e.target.value || null)}
            disabled={loading || !videos.length}
            className="h-10 min-w-[min(100%,20rem)] rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">
              {loading ? "Loading videos…" : "Choose a video…"}
            </option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.snippet.title.slice(0, 80)}
                {v.snippet.title.length > 80 ? "…" : ""}
              </option>
            ))}
          </select>
        </label>
        {videosQuery.hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => videosQuery.fetchNextPage()}
            disabled={videosQuery.isFetchingNextPage}
          >
            {videosQuery.isFetchingNextPage ? "Loading…" : "Load more videos"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="min-w-0 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Comment threads
          </h2>
          <CommentThreadsList videoId={videoId} />
        </div>
        <div className="min-w-0">
          <SavedRepliesPanel
            onInsert={(text) => {
              void navigator.clipboard.writeText(text)
              toast.success("Copied — paste into a reply box.")
            }}
          />
        </div>
      </div>
    </div>
  )
}
