"use client"

import { useQuery } from "@tanstack/react-query"
import type { YouTubeChannel } from "@/types/youtube"
import { queryKeys } from "@/lib/query-keys"

async function fetchChannel(): Promise<YouTubeChannel> {
  const res = await fetch("/api/youtube/channel")
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load channel"
    throw new Error(msg)
  }
  return data as YouTubeChannel
}

export function useChannel() {
  return useQuery({
    queryKey: queryKeys.channel,
    queryFn: fetchChannel,
  })
}
