"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"

function useAnimatedNumber(target: number, run: boolean): number {
  const [v, setV] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (!run) return
    const start = performance.now()
    const from = 0
    const duration = 900

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setV(Math.round(from + (target - from) * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, run])

  return run ? v : target
}

export function StatCard({
  title,
  value,
  loading,
  suffix,
}: {
  title: string
  value: number
  loading?: boolean
  suffix?: string
}) {
  const reduceMotion = useReducedMotion()
  const reduce = reduceMotion ?? false
  const animate = !reduce && !loading
  const animatedValue = useAnimatedNumber(value, animate)

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-shadow hover:shadow-md motion-reduce:transition-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-[family-name:var(--font-mono)] text-3xl font-semibold tabular-nums">
          {formatNumber(reduce ? value : animatedValue)}
          {suffix ? (
            <span className="ml-1 text-lg font-normal text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  )
}
