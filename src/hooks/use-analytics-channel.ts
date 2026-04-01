"use client"

import { useQuery } from "@tanstack/react-query"
import type { ChannelAnalyticsResult } from "@/types/analytics"
import { queryKeys } from "@/lib/query-keys"

async function fetchChannelAnalytics(
  startDate: string,
  endDate: string
): Promise<ChannelAnalyticsResult> {
  const qs = new URLSearchParams({ startDate, endDate })
  const res = await fetch(`/api/youtube/analytics/channel?${qs}`)
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load analytics"
    throw new Error(msg)
  }
  return data as ChannelAnalyticsResult
}

export function useAnalyticsChannel(startDate: string, endDate: string) {
  const enabled = Boolean(
    startDate &&
      endDate &&
      startDate.length === 10 &&
      endDate.length === 10 &&
      startDate <= endDate
  )

  return useQuery({
    queryKey: queryKeys.analyticsChannel(startDate, endDate),
    queryFn: () => fetchChannelAnalytics(startDate, endDate),
    enabled,
  })
}
