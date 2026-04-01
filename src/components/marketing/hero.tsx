"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MarketingHero() {
  const reduce = useReducedMotion()

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 dark:opacity-25"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[24rem] w-[24rem] rounded-full bg-primary/20 blur-3xl" />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary"
        >
          YouTube, reimagined
        </motion.p>
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="font-[family-name:var(--font-marketing-display)] text-4xl font-bold leading-tight tracking-tight sm:text-6xl sm:leading-[1.05]"
        >
          Your channel command center
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Sign in with Google, pull live stats and videos, and manage everything
          from one fast, focused dashboard built for creators.
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg" asChild className="gap-2 px-8">
            <Link href="/login">
              Open dashboard <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <a href="#features">
              <Play className="size-4" /> See features
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
