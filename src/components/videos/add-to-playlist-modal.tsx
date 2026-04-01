"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  addVideoToPlaylist,
  fetchMyPlaylists,
} from "@/lib/youtube-client"
import { toast } from "@/components/ui/toast"

export function AddToPlaylistModal({
  videoIds,
  open,
  onClose,
}: {
  videoIds: string[]
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [playlistId, setPlaylistId] = React.useState("")

  const playlistsQuery = useQuery({
    queryKey: ["youtube", "playlists", "mine"],
    queryFn: fetchMyPlaylists,
    enabled: open,
  })

  React.useEffect(() => {
    if (!open) setPlaylistId("")
  }, [open])

  const mutation = useMutation({
    mutationFn: async (pid: string) => {
      const results = await Promise.allSettled(
        videoIds.map((vid) => addVideoToPlaylist(pid, vid))
      )
      const failed = results.filter((r) => r.status === "rejected").length
      if (failed > 0) {
        const firstErr = results.find(
          (r): r is PromiseRejectedResult => r.status === "rejected"
        )
        throw new Error(
          firstErr?.reason instanceof Error
            ? firstErr.reason.message
            : `${failed} of ${videoIds.length} failed`
        )
      }
    },
    onSuccess: async () => {
      toast.success(
        `Added ${videoIds.length} video${videoIds.length === 1 ? "" : "s"} to playlist.`
      )
      await queryClient.invalidateQueries({ queryKey: ["youtube", "videos"] })
      onClose()
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  if (!open) return null

  const lists = playlistsQuery.data ?? []

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 motion-reduce:transition-none animate-in fade-in-0"
        aria-label="Close"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-md overflow-hidden shadow-xl motion-reduce:transition-none animate-in zoom-in-95 fade-in-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Add to playlist</h2>
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
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">
            {videoIds.length} video{videoIds.length === 1 ? "" : "s"} selected.
          </p>
          {playlistsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading playlists…</p>
          ) : playlistsQuery.isError ? (
            <p className="text-sm text-destructive">
              {playlistsQuery.error instanceof Error
                ? playlistsQuery.error.message
                : "Could not load playlists"}
            </p>
          ) : lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No playlists found. Create one in YouTube Studio first.
            </p>
          ) : (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Playlist</span>
              <select
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Choose a playlist…</option>
                {lists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !playlistId ||
                mutation.isPending ||
                lists.length === 0 ||
                videoIds.length === 0
              }
              onClick={() => mutation.mutate(playlistId)}
            >
              {mutation.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
