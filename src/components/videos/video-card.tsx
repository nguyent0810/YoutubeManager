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
}: {
  video: YouTubeVideo
  layout: "grid" | "list"
  selected?: boolean
  onSelect: () => void
}) {
  const thumb =
    video.snippet.thumbnails.medium?.url ||
    video.snippet.thumbnails.high?.url ||
    video.snippet.thumbnails.default?.url
  const views = parseInt(video.statistics?.viewCount ?? "0", 10)
  const dur = parseDuration(video.contentDetails.duration)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full rounded-lg border border-border bg-card text-left transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
        selected && "border-primary ring-2 ring-primary/20",
        layout === "list" && "flex gap-4 p-3",
        layout === "grid" && "overflow-hidden"
      )}
    >
      <div
        className={cn(
          "relative bg-muted",
          layout === "grid" && "aspect-video w-full",
          layout === "list" && "aspect-video w-full max-w-[200px] shrink-0 overflow-hidden rounded-md sm:max-w-[240px]"
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
          {video.status?.privacyStatus && video.status.privacyStatus !== "public" ? (
            <Badge variant="secondary" className="text-[10px]">
              {video.status.privacyStatus}
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  )
}
