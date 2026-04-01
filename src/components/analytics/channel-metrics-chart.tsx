"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface ChartPoint {
  label: string
  views: number
  minutes: number
}

const VIEW_COLOR = "hsl(348 100% 50%)"
const MINUTES_COLOR = "hsl(217 91% 60%)"

function formatTooltipMinutes(v: number) {
  if (v >= 60) return `${(v / 60).toFixed(1)}h watch time`
  return `${Math.round(v)} min watch time`
}

export function ChannelMetricsChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No rows returned for this date range.
      </div>
    )
  }

  const tiltLabels = data.length > 14

  return (
    <div className="h-[320px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            interval="preserveStartEnd"
            angle={tiltLabels ? -35 : 0}
            textAnchor={tiltLabels ? "end" : "middle"}
            height={tiltLabels ? 52 : 28}
          />
          <YAxis
            yAxisId="views"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
            }
            label={{
              value: "Views",
              angle: -90,
              position: "insideLeft",
              style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="minutes"
            orientation="right"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 60 ? `${(v / 60).toFixed(0)}h` : `${v}m`
            }
            label={{
              value: "Watch time (min)",
              angle: 90,
              position: "insideRight",
              style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value, name) => {
              const v = value as number | string | undefined
              const n =
                typeof v === "number" ? v : Number(v ?? 0)
              const label = String(name ?? "")
              if (label === "Watch time (min)") {
                return [formatTooltipMinutes(n), label]
              }
              return [n, label]
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            formatter={(value) => (
              <span className="text-muted-foreground">{value}</span>
            )}
          />
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="views"
            name="Views"
            stroke={VIEW_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="minutes"
            type="monotone"
            dataKey="minutes"
            name="Watch time (min)"
            stroke={MINUTES_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
