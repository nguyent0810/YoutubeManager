"use client"

import type { PrivacyStatus } from "@/types/youtube"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const OPTIONS: Array<{ value: PrivacyStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
]

export function VideoFilters({
  value,
  onChange,
}: {
  value: PrivacyStatus | "all"
  onChange: (v: PrivacyStatus | "all") => void
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as PrivacyStatus | "all")}
      className="w-full sm:w-auto"
    >
      <TabsList className="h-9 w-full flex-wrap justify-start gap-1 bg-muted/80 p-1 sm:w-auto">
        {OPTIONS.map((o) => (
          <TabsTrigger
            key={o.value}
            value={o.value}
            className="px-3 text-xs sm:text-sm"
          >
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
