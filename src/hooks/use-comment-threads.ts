"use client"

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { CommentThreadsListResult } from "@/lib/youtube"
import { queryKeys } from "@/lib/query-keys"

async function fetchThreads(
  videoId: string,
  pageToken?: string
): Promise<CommentThreadsListResult> {
  const params = new URLSearchParams({ videoId })
  if (pageToken) params.set("pageToken", pageToken)
  const res = await fetch(`/api/youtube/comment-threads?${params}`)
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load comments"
    throw new Error(msg)
  }
  return data as CommentThreadsListResult
}

export function useCommentThreads(videoId: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.commentThreads(videoId ?? ""),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchThreads(videoId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextPageToken,
    enabled: !!videoId,
  })
}

export function usePostCommentReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { parentId: string; textOriginal: string }) => {
      const res = await fetch("/api/youtube/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to post reply"
        throw new Error(msg)
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["youtube", "commentThreads"] })
    },
  })
}
