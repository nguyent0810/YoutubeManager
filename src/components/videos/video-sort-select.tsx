"use client"

import type { VideoSearchOrder } from "@/lib/youtube"
import { cn } from "@/lib/utils"

const OPTIONS: { value: VideoSearchOrder; label: string }[] = [
  { value: "date", label: "Upload date" },
  { value: "viewCount", label: "View count" },
  { value: "title", label: "Title" },
  { value: "rating", label: "Rating" },
  { value: "relevance", label: "Relevance" },
  { value: "videoCount", label: "Video count" },
]

export function VideoSortSelect({
  value,
  onChange,
  className,
}: {
  value: VideoSearchOrder
  onChange: (order: VideoSearchOrder) => void
  className?: string
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="text-muted-foreground">Sort by</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VideoSearchOrder)}
        className="h-9 w-full min-w-[10rem] rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
