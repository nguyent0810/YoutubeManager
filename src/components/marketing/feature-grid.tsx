"use client"

import { motion, useReducedMotion } from "framer-motion"
import { BarChart3, LayoutGrid, Shield, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const FEATURES = [
  {
    title: "Live channel pulse",
    description:
      "Subscriber, view, and video counts update from your channel the moment you connect.",
    icon: BarChart3,
  },
  {
    title: "Video manager",
    description:
      "Search, filter by visibility, switch grid or list, and inspect details without leaving the app.",
    icon: LayoutGrid,
  },
  {
    title: "Secure by design",
    description:
      "Google OAuth with read-only YouTube scopes. Tokens stay on the server; you stay in control.",
    icon: Shield,
  },
  {
    title: "Fast & focused",
    description:
      "Built on Next.js with skeleton states, optimistic UI patterns, and a shell tuned for daily use.",
    icon: Zap,
  },
] as const

export function FeatureGrid() {
  const reduce = useReducedMotion()

  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="font-[family-name:var(--font-marketing-display)] text-center text-3xl font-bold sm:text-4xl">
          Everything you need for v1
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Polished flows first — uploads, comments, and AI can wait until the core
          experience feels incredible.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card className="h-full border-border/80 bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-md motion-reduce:transition-none">
                <CardHeader className="pb-2">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
