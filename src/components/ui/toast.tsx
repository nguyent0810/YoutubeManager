"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ToastVariant = "default" | "destructive"

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

type Listener = (toasts: ToastData[]) => void

const listeners = new Set<Listener>()
let memory: ToastData[] = []

function push(t: Omit<ToastData, "id">) {
  const id = crypto.randomUUID()
  memory = [...memory, { ...t, id }]
  listeners.forEach((l) => l(memory))
  window.setTimeout(() => dismiss(id), 4500)
}

function dismiss(id: string) {
  memory = memory.filter((x) => x.id !== id)
  listeners.forEach((l) => l(memory))
}

export const toast = {
  success: (description: string, title = "Done") =>
    push({ title, description, variant: "default" }),
  error: (description: string, title = "Error") =>
    push({ title, description, variant: "destructive" }),
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  React.useEffect(() => {
    listeners.add(setToasts)
    setToasts(memory)
    return () => {
      listeners.delete(setToasts)
    }
  }, [])

  if (!toasts.length) return null

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg motion-reduce:transition-none animate-in slide-in-from-bottom-2 fade-in-0",
            t.variant === "destructive" &&
              "border-destructive/50 bg-destructive/10 text-destructive-foreground"
          )}
        >
          {t.title && <p className="font-semibold">{t.title}</p>}
          {t.description && (
            <p className="text-sm text-muted-foreground">{t.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
