"use client"

import { StatCard } from "@/components/dashboard/stat-card"
import { RecentVideos } from "@/components/dashboard/recent-videos"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { useChannel } from "@/hooks/use-channel"
import { useVideos } from "@/hooks/use-videos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  const channelQuery = useChannel()
  const channel = channelQuery.data
  const channelLoading = channelQuery.isLoading
  const channelError = channelQuery.isError

  const videosQuery = useVideos(channel?.id, {})
  const firstPage = videosQuery.data?.pages[0]
  const videos = firstPage?.videos ?? []
  const videosLoading = videosQuery.isLoading && !!channel?.id

  const subs = parseInt(channel?.subscriberCount ?? "0", 10)
  const views = parseInt(channel?.viewCount ?? "0", 10)
  const vidCount = parseInt(channel?.videoCount ?? "0", 10)

  if (channelError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Could not load channel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {channelQuery.error instanceof Error
              ? channelQuery.error.message
              : "Check that you are signed in and that YouTube Data API access is enabled."}
          </p>
          <Button type="button" variant="outline" asChild>
            <Link href="/login">Return to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {channelLoading ? "Loading…" : channel?.title ?? "Dashboard"}
        </h1>
        {!channelLoading && channel?.customUrl ? (
          <p className="text-sm text-muted-foreground">@{channel.customUrl}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Subscribers" value={subs} loading={channelLoading} />
        <StatCard title="Total views" value={views} loading={channelLoading} />
        <StatCard title="Videos" value={vidCount} loading={channelLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentVideos videos={videos} loading={videosLoading} />
        </div>
        <QuickActions channelId={channel?.id} />
      </div>
    </div>
  )
}
