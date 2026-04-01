"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChannelMetricsChart } from "@/components/analytics/channel-metrics-chart"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAnalyticsChannel } from "@/hooks/use-analytics-channel"
import { rangeEndingToday } from "@/lib/date-range"

type Preset = 7 | 28 | 90

function formatDayLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>(28)
  const { startDate, endDate } = useMemo(
    () => rangeEndingToday(preset),
    [preset]
  )

  const query = useAnalyticsChannel(startDate, endDate)

  const totals = useMemo(() => {
    const rows = query.data?.rows ?? []
    let views = 0
    let minutes = 0
    let subs = 0
    for (const r of rows) {
      views += r.views
      minutes += r.estimatedMinutesWatched
      subs += r.subscribersGained
    }
    return { views, minutes, subs }
  }, [query.data])

  const chartData = useMemo(() => {
    const rows = query.data?.rows ?? []
    return rows.map((r) => ({
      label: r.day ? formatDayLabel(r.day) : "—",
      views: r.views,
      minutes: r.estimatedMinutesWatched,
    }))
  }, [query.data])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Channel performance from YouTube Analytics (daily).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([7, 28, 90] as const).map((d) => (
            <Button
              key={d}
              type="button"
              variant={preset === d ? "default" : "outline"}
              size="sm"
              onClick={() => setPreset(d)}
            >
              Last {d} days
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {startDate} → {endDate}
      </p>

      {query.isError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">
              Could not load analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {query.error instanceof Error
                ? query.error.message
                : "Check that YouTube Analytics API access is enabled and you granted analytics scopes."}
            </p>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">Back to overview</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      ) : query.isSuccess ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Views (period)"
            value={totals.views}
            loading={false}
          />
          <StatCard
            title="Watch time"
            value={Math.max(0, Math.round(totals.minutes / 60))}
            suffix="h"
            loading={false}
          />
          <StatCard
            title="Subscribers gained"
            value={totals.subs}
            loading={false}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {query.isLoading ? (
            <Skeleton className="h-[320px] w-full rounded-lg" />
          ) : (
            <ChannelMetricsChart data={chartData} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
