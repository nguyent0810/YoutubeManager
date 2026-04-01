"use client"

import * as React from "react"
import { useChannel } from "@/hooks/use-channel"
import { useVideos } from "@/hooks/use-videos"
import type { PrivacyStatus } from "@/types/youtube"
import { VideoSearch } from "@/components/videos/video-search"
import { VideoFilters } from "@/components/videos/video-filters"
import { VideoListView } from "@/components/videos/video-list"
import { VideoDetailPanel } from "@/components/videos/video-detail-panel"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VideosPage() {
  const [search, setSearch] = React.useState("")
  const deferredSearch = React.useDeferredValue(search)
  const [privacy, setPrivacy] = React.useState<PrivacyStatus | "all">("all")
  const [layout, setLayout] = React.useState<"grid" | "list">("grid")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const channelQuery = useChannel()
  const channelId = channelQuery.data?.id

  const videosQuery = useVideos(channelId, {
    q: deferredSearch,
    privacy,
  })

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
    <div
      className={`space-y-6 transition-[padding] motion-reduce:transition-none ${selectedId ? "lg:pr-[min(28rem,40vw)]" : ""}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video manager</h1>
          <p className="text-sm text-muted-foreground">
            Search and filter your uploads. Select a video for details.
          </p>
        </div>
        <Tabs
          value={layout}
          onValueChange={(v) => setLayout(v as "grid" | "list")}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9">
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <VideoSearch value={search} onChange={setSearch} />
        <VideoFilters value={privacy} onChange={setPrivacy} />
      </div>

      <VideoListView
        videos={videos}
        layout={layout}
        selectedId={selectedId}
        onSelect={setSelectedId}
        loading={loading}
        hasNextPage={videosQuery.hasNextPage}
        isFetchingNextPage={videosQuery.isFetchingNextPage}
        onLoadMore={() => videosQuery.fetchNextPage()}
      />

      {selectedId ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 motion-reduce:transition-none animate-in fade-in-0 md:hidden"
            aria-label="Close details"
            onClick={() => setSelectedId(null)}
          />
          <VideoDetailPanel
            videoId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        </>
      ) : null}
    </div>
  )
}
