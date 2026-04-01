"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function VideoSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        placeholder="Search your videos…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
        aria-label="Search videos"
      />
    </div>
  )
}
