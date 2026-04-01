"use client"

import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { X, ExternalLink, Pencil } from "lucide-react"
import type { YouTubeVideo } from "@/types/youtube"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatNumber,
  getRelativeTime,
  parseDuration,
  formatDuration,
  formatPercentage,
  calculateEngagementRate,
} from "@/lib/utils"
import { queryKeys } from "@/lib/query-keys"
import { fetchVideoById } from "@/lib/youtube-client"

export function VideoDetailPanel({
  videoId,
  onClose,
  onEditMetadata,
}: {
  videoId: string | null
  onClose: () => void
  onEditMetadata?: () => void
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.video(videoId ?? undefined),
    queryFn: () => fetchVideoById(videoId!),
    enabled: !!videoId,
  })

  if (!videoId) return null

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-xl motion-reduce:transition-none animate-in slide-in-from-right duration-200 md:max-w-lg"
      aria-label="Video details"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X className="size-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}
        {data && !isLoading && (
          <VideoDetailContent video={data} onEditMetadata={onEditMetadata} />
        )}
      </div>
    </aside>
  )
}

function VideoDetailContent({
  video,
  onEditMetadata,
}: {
  video: YouTubeVideo
  onEditMetadata?: () => void
}) {
  const thumb =
    video.snippet.thumbnails.high?.url ||
    video.snippet.thumbnails.medium?.url ||
    video.snippet.thumbnails.default?.url
  const views = parseInt(video.statistics?.viewCount ?? "0", 10)
  const likes = parseInt(video.statistics?.likeCount ?? "0", 10)
  const comments = parseInt(video.statistics?.commentCount ?? "0", 10)
  const engagement = calculateEngagementRate(likes, comments, views)
  const dur = parseDuration(video.contentDetails.duration)
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {thumb ? (
          <Image src={thumb} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 448px" />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {video.status?.privacyStatus ? (
          <Badge>{video.status.privacyStatus}</Badge>
        ) : null}
        <Badge variant="secondary">{formatDuration(dur)}</Badge>
      </div>
      <h3 className="text-xl font-semibold leading-snug">{video.snippet.title}</h3>
      <p className="text-sm text-muted-foreground">
        Published {getRelativeTime(video.snippet.publishedAt)}
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Views</dt>
          <dd className="font-medium tabular-nums">{formatNumber(views)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Likes</dt>
          <dd className="font-medium tabular-nums">{formatNumber(likes)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Comments</dt>
          <dd className="font-medium tabular-nums">{formatNumber(comments)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Engagement</dt>
          <dd className="font-medium tabular-nums">
            {views > 0 ? formatPercentage(engagement) : "—"}
          </dd>
        </div>
      </dl>
      <p className="line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground">
        {video.snippet.description || "No description"}
      </p>
      {onEditMetadata ? (
        <Button
          type="button"
          className="w-full gap-2"
          variant="secondary"
          onClick={onEditMetadata}
        >
          <Pencil className="size-4" /> Edit metadata
        </Button>
      ) : null}
      <Button className="w-full gap-2" variant="outline" asChild>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" /> Open on YouTube
        </a>
      </Button>
    </div>
  )
}
