"use client"

import Image from "next/image"
import type { YouTubeVideo } from "@/types/youtube"
import { cn } from "@/lib/utils"
import {
  formatNumber,
  getRelativeTime,
  parseDuration,
  formatDuration,
} from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function VideoCard({
  video,
  layout,
  selected,
  onSelect,
  selectionEnabled,
  bulkSelected,
  onBulkToggle,
}: {
  video: YouTubeVideo
  layout: "grid" | "list"
  selected?: boolean
  onSelect: () => void
  selectionEnabled?: boolean
  bulkSelected?: boolean
  onBulkToggle?: () => void
}) {
  const thumb =
    video.snippet.thumbnails.medium?.url ||
    video.snippet.thumbnails.high?.url ||
    video.snippet.thumbnails.default?.url
  const views = parseInt(video.statistics?.viewCount ?? "0", 10)
  const dur = parseDuration(video.contentDetails.duration)

  const bulkCheckbox =
    selectionEnabled && onBulkToggle ? (
      <div
        className={cn(
          "z-10",
          layout === "grid" ? "absolute left-2 top-2" : "flex shrink-0 items-start pt-4 pl-2"
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={!!bulkSelected}
          onChange={onBulkToggle}
          className="size-4 rounded border-input accent-primary"
          aria-label={`Select ${video.snippet.title}`}
        />
      </div>
    ) : null

  return (
    <div
      className={cn(
        "group relative w-full rounded-lg border border-border bg-card text-left transition-all hover:border-primary/40 hover:shadow-md motion-reduce:transition-none",
        selected && "border-primary ring-2 ring-primary/20",
        layout === "grid" && "overflow-hidden",
        layout === "list" && "flex"
      )}
    >
      {bulkCheckbox}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          layout === "grid" && "w-full",
          layout === "list" && "flex flex-1 gap-4 p-3"
        )}
      >
        <div
          className={cn(
            "relative bg-muted",
            layout === "grid" && "aspect-video w-full",
            layout === "list" &&
              "aspect-video w-full max-w-[200px] shrink-0 overflow-hidden rounded-md sm:max-w-[240px]"
          )}
        >
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              fill
              className="object-cover transition-transform group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
              sizes="(max-width: 640px) 100vw, 320px"
            />
          ) : null}
          <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white">
            {formatDuration(dur)}
          </span>
        </div>
        <div className={cn("p-3", layout === "list" && "min-w-0 flex-1 py-2")}>
          <p className="line-clamp-2 font-medium leading-snug">{video.snippet.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{getRelativeTime(video.snippet.publishedAt)}</span>
            <span>·</span>
            <span>{formatNumber(views)} views</span>
            {video.status?.privacyStatus &&
            video.status.privacyStatus !== "public" ? (
              <Badge variant="secondary" className="text-[10px]">
                {video.status.privacyStatus}
              </Badge>
            ) : null}
          </div>
        </div>
      </button>
    </div>
  )
}
