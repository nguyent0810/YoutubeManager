"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { YouTubeVideosResponse } from "@/types/youtube"

export interface UseVideosFilters {
  q?: string
  privacy?: string
}

export function useVideos(
  channelId: string | undefined,
  filters: UseVideosFilters = {}
) {
  const { q = "", privacy = "all" } = filters

  return useInfiniteQuery({
    queryKey: queryKeys.videos(channelId, q, privacy),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams({
        channelId: channelId!,
        maxResults: "24",
      })
      if (pageParam) params.set("pageToken", pageParam)
      if (q.trim()) params.set("q", q.trim())
      if (privacy !== "all") params.set("privacy", privacy)

      const res = await fetch(`/api/youtube/videos?${params}`)
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to load videos"
        throw new Error(msg)
      }
      return data as YouTubeVideosResponse
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextPageToken,
    enabled: !!channelId,
  })
}
