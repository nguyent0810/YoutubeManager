import { z } from "zod"

export const videoSearchOrderSchema = z.enum([
  "date",
  "rating",
  "relevance",
  "title",
  "videoCount",
  "viewCount",
])

export const listVideosQuerySchema = z.object({
  channelId: z.string().min(1),
  pageToken: z.string().optional(),
  maxResults: z.coerce.number().int().min(1).max(50).optional().default(50),
  q: z.string().optional(),
  privacy: z.enum(["all", "public", "private", "unlisted"]).optional().default("all"),
  order: videoSearchOrderSchema.optional().default("date"),
})

export type ListVideosQuery = z.infer<typeof listVideosQuerySchema>
