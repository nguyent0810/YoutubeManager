"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: "left" | "right"
  children: React.ReactNode
  className?: string
}) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 motion-reduce:transition-none animate-in fade-in-0"
        aria-label="Close menu"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute top-0 flex h-full w-[min(100%,20rem)] flex-col border-border bg-background shadow-xl motion-reduce:transition-none animate-in duration-200",
          side === "right" ? "right-0 border-l slide-in-from-right" : "left-0 border-r slide-in-from-left",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between border-b border-border p-4", className)}
      {...props}
    />
  )
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold", className)} {...props} />
  )
}

export function SheetContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto p-4", className)} {...props} />
}
