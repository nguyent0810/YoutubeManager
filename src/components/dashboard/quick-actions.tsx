"use client"

import Link from "next/link"
import { BarChart3, Columns3, Video, Settings, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuickActions({ channelId }: { channelId?: string }) {
  const studioUrl = channelId
    ? `https://studio.youtube.com/channel/${channelId}`
    : "https://studio.youtube.com"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href="/dashboard/videos">
            <Video className="size-4" /> Manage videos
          </Link>
        </Button>
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href="/dashboard/analytics">
            <BarChart3 className="size-4" /> Analytics
          </Link>
        </Button>
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href="/dashboard/pipeline">
            <Columns3 className="size-4" /> Pipeline
          </Link>
        </Button>
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href="/dashboard/settings">
            <Settings className="size-4" /> Settings
          </Link>
        </Button>
        <Button variant="outline" className="justify-start gap-2" asChild>
          <a href={studioUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" /> YouTube Studio
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
