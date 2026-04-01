/** Central React Query keys for YouTube data */
export const queryKeys = {
  channel: ["youtube", "channel"] as const,
  videos: (
    channelId: string | undefined,
    q: string,
    privacy: string,
    order: string
  ) => ["youtube", "videos", channelId ?? "", q, privacy, order] as const,
  video: (id: string | undefined) => ["youtube", "video", id ?? ""] as const,
  analyticsChannel: (from: string, to: string) =>
    ["youtube", "analytics", "channel", from, to] as const,
  analyticsVideo: (id: string, from: string, to: string) =>
    ["youtube", "analytics", "video", id, from, to] as const,
  savedReplies: ["saved-replies"] as const,
  commentThreads: (videoId: string) =>
    ["youtube", "commentThreads", videoId] as const,
  pipeline: ["pipeline"] as const,
}
