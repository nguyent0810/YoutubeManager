"use client"

import Image from "next/image"
import Link from "next/link"
import type { YouTubeVideo } from "@/types/youtube"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  formatNumber,
  getRelativeTime,
  parseDuration,
  formatDuration,
} from "@/lib/utils"

export function RecentVideos({
  videos,
  loading,
}: {
  videos: YouTubeVideo[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent uploads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-20 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!videos.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No videos yet, or they are still loading from YouTube. Try refreshing
            in a moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent uploads</CardTitle>
        <Link
          href="/dashboard/videos"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {videos.slice(0, 5).map((v) => {
          const thumb =
            v.snippet.thumbnails.medium?.url ||
            v.snippet.thumbnails.default?.url
          const views = parseInt(v.statistics?.viewCount ?? "0", 10)
          const dur = parseDuration(v.contentDetails.duration)

          return (
            <div key={v.id} className="flex gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium leading-snug">
                  {v.snippet.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{getRelativeTime(v.snippet.publishedAt)}</span>
                  <span>·</span>
                  <span>{formatNumber(views)} views</span>
                  <span>·</span>
                  <span>{formatDuration(dur)}</span>
                  {v.status?.privacyStatus && v.status.privacyStatus !== "public" ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {v.status.privacyStatus}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
