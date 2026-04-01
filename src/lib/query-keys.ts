/** Central React Query keys for YouTube data */
export const queryKeys = {
  channel: ["youtube", "channel"] as const,
  videos: (channelId: string | undefined, q: string, privacy: string) =>
    ["youtube", "videos", channelId ?? "", q, privacy] as const,
  video: (id: string | undefined) => ["youtube", "video", id ?? ""] as const,
  analyticsChannel: (from: string, to: string) =>
    ["youtube", "analytics", "channel", from, to] as const,
  analyticsVideo: (id: string, from: string, to: string) =>
    ["youtube", "analytics", "video", id, from, to] as const,
}
