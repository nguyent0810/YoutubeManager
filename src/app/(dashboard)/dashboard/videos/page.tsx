"use client"

import * as React from "react"
import { useChannel } from "@/hooks/use-channel"
import { useVideos } from "@/hooks/use-videos"
import type { PrivacyStatus } from "@/types/youtube"
import type { VideoSearchOrder } from "@/lib/youtube"
import { VideoSearch } from "@/components/videos/video-search"
import { VideoFilters } from "@/components/videos/video-filters"
import { VideoSortSelect } from "@/components/videos/video-sort-select"
import { VideoListView } from "@/components/videos/video-list"
import { VideoDetailPanel } from "@/components/videos/video-detail-panel"
import { VideoMetadataModal } from "@/components/videos/video-metadata-modal"
import { AddToPlaylistModal } from "@/components/videos/add-to-playlist-modal"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VideosPage() {
  const [search, setSearch] = React.useState("")
  const deferredSearch = React.useDeferredValue(search)
  const [privacy, setPrivacy] = React.useState<PrivacyStatus | "all">("all")
  const [order, setOrder] = React.useState<VideoSearchOrder>("date")
  const [layout, setLayout] = React.useState<"grid" | "list">("grid")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [metadataOpen, setMetadataOpen] = React.useState(false)
  const [metadataVideoId, setMetadataVideoId] = React.useState<string | null>(
    null
  )
  const [playlistOpen, setPlaylistOpen] = React.useState(false)

  const channelQuery = useChannel()
  const channelId = channelQuery.data?.id

  const videosQuery = useVideos(channelId, {
    q: deferredSearch,
    privacy,
    order,
  })

  const videos = React.useMemo(
    () => videosQuery.data?.pages.flatMap((p) => p.videos) ?? [],
    [videosQuery.data]
  )

  React.useEffect(() => {
    setSelectedIds([])
  }, [order, privacy, deferredSearch])

  const loading =
    channelQuery.isLoading ||
    (videosQuery.isLoading && !!channelId && !videosQuery.data)

  const handleBulkToggle = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const handleSelectAllPage = React.useCallback(() => {
    const ids = videos.map((v) => v.id)
    setSelectedIds((prev) => {
      const allSelected =
        ids.length > 0 && ids.every((id) => prev.includes(id))
      if (allSelected) return prev.filter((id) => !ids.includes(id))
      return [...new Set([...prev, ...ids])]
    })
  }, [videos])

  const openMetadata = React.useCallback((id: string) => {
    setMetadataVideoId(id)
    setMetadataOpen(true)
  }, [])

  const closeMetadata = React.useCallback(() => {
    setMetadataOpen(false)
    setMetadataVideoId(null)
  }, [])

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
            Search, sort, and select videos to edit metadata or add to a
            playlist.{" "}
            <Link
              href="/dashboard/upload"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Upload
            </Link>
            {" · "}
            <Link
              href="/dashboard/bulk-upload"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Bulk upload
            </Link>
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

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <VideoSearch value={search} onChange={setSearch} />
        <VideoFilters value={privacy} onChange={setPrivacy} />
        <VideoSortSelect value={order} onChange={setOrder} />
      </div>

      {selectedIds.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm"
          role="status"
        >
          <span className="font-medium tabular-nums">
            {selectedIds.length} selected
          </span>
          <Button type="button" size="sm" onClick={() => setPlaylistOpen(true)}>
            Add to playlist
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedIds.length !== 1}
            onClick={() =>
              selectedIds.length === 1 && openMetadata(selectedIds[0])
            }
          >
            Edit metadata
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds([])}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <VideoListView
        videos={videos}
        layout={layout}
        selectedId={selectedId}
        onSelect={setSelectedId}
        loading={loading}
        hasNextPage={videosQuery.hasNextPage}
        isFetchingNextPage={videosQuery.isFetchingNextPage}
        onLoadMore={() => videosQuery.fetchNextPage()}
        selectionEnabled
        bulkSelectedIds={selectedIds}
        onBulkToggle={handleBulkToggle}
        onBulkSelectAll={handleSelectAllPage}
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
            onEditMetadata={() => openMetadata(selectedId)}
          />
        </>
      ) : null}

      <VideoMetadataModal
        videoId={metadataVideoId}
        open={metadataOpen}
        onClose={closeMetadata}
      />

      <AddToPlaylistModal
        videoIds={selectedIds}
        open={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
      />
    </div>
  )
}
