"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const MenuCtx = React.createContext<{
  open: boolean
  setOpen: (v: boolean) => void
} | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <MenuCtx.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </MenuCtx.Provider>
  )
}

export function DropdownMenuTrigger({
  className,
  asChild,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const ctx = React.useContext(MenuCtx)
  if (!ctx) throw new Error("DropdownMenuTrigger outside DropdownMenu")

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: (e: React.MouseEvent) => void
    }>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        ctx.setOpen(!ctx.open)
      },
    })
  }

  return (
    <button
      type="button"
      className={cn(className)}
      onClick={() => ctx.setOpen(!ctx.open)}
      aria-expanded={ctx.open}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  className,
  align = "end",
  children,
}: {
  className?: string
  align?: "start" | "end"
  children: React.ReactNode
}) {
  const ctx = React.useContext(MenuCtx)
  if (!ctx) throw new Error("DropdownMenuContent outside DropdownMenu")
  if (!ctx.open) return null

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 mt-1 min-w-[10rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md motion-reduce:animate-none animate-in fade-in-0 zoom-in-95",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  className,
  destructive,
  onSelect,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  destructive?: boolean
  onSelect?: () => void
}) {
  const ctx = React.useContext(MenuCtx)
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        destructive && "text-destructive hover:bg-destructive/10",
        className
      )}
      onClick={() => {
        onSelect?.()
        ctx?.setOpen(false)
      }}
      {...props}
    />
  )
}
