"use client"

import type { YouTubeVideo } from "@/types/youtube"
import { VideoCard } from "@/components/videos/video-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function VideoListView({
  videos,
  layout,
  selectedId,
  onSelect,
  loading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  selectionEnabled,
  bulkSelectedIds,
  onBulkToggle,
  onBulkSelectAll,
}: {
  videos: YouTubeVideo[]
  layout: "grid" | "list"
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  selectionEnabled?: boolean
  bulkSelectedIds?: string[]
  onBulkToggle?: (id: string) => void
  onBulkSelectAll?: () => void
}) {
  const bulkSet = new Set(bulkSelectedIds ?? [])
  const ids = videos.map((v) => v.id)
  const allOnPageSelected =
    ids.length > 0 && ids.every((id) => bulkSet.has(id))

  if (loading) {
    return (
      <div
        className={
          layout === "grid"
            ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-3"
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className={layout === "grid" ? "aspect-video rounded-lg" : "h-32 rounded-lg"}
          />
        ))}
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <p className="font-medium">No videos match</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Try another search keyword or visibility filter. New uploads can take a
          moment to appear in search.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {selectionEnabled && onBulkSelectAll ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={() => onBulkSelectAll?.()}
              className="size-4 rounded border-input accent-primary"
            />
            Select all on this page
          </label>
        </div>
      ) : null}
      <div
        className={
          layout === "grid"
            ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-3"
        }
      >
        {videos.map((v) => (
          <VideoCard
            key={v.id}
            video={v}
            layout={layout}
            selected={selectedId === v.id}
            onSelect={() => onSelect(v.id)}
            selectionEnabled={selectionEnabled}
            bulkSelected={bulkSet.has(v.id)}
            onBulkToggle={() => onBulkToggle?.(v.id)}
          />
        ))}
      </div>
      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
