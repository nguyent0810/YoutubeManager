"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  const reduce = useReducedMotion()

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-background to-background p-10 text-center shadow-lg sm:p-14"
      >
        <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-bold sm:text-3xl">
          Ready when you are
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          One click with Google — then your dashboard, videos, and settings in
          one place.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/login">Get started</Link>
        </Button>
      </motion.div>
    </section>
  )
}
