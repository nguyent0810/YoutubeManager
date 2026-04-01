"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TabsCtx = React.createContext<{
  value: string
  setValue: (v: string) => void
} | null>(null)

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  className,
  children,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "")
  const value = controlled ?? uncontrolled
  const setValue = React.useCallback(
    (v: string) => {
      if (controlled === undefined) setUncontrolled(v)
      onValueChange?.(v)
    },
    [controlled, onValueChange]
  )

  return (
    <TabsCtx.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  value,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsCtx)
  if (!ctx) throw new Error("TabsTrigger outside Tabs")
  const selected = ctx.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
        selected && "bg-background text-foreground shadow-sm",
        className
      )}
      onClick={() => ctx.setValue(value)}
      {...props}
    />
  )
}

export function TabsContent({
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = React.useContext(TabsCtx)
  if (!ctx) throw new Error("TabsContent outside Tabs")
  if (ctx.value !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn("mt-4 ring-offset-background focus-visible:outline-none", className)}
      {...props}
    />
  )
}
