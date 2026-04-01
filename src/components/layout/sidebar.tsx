"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Columns3,
  FolderInput,
  LayoutDashboard,
  MessageSquare,
  Upload,
  Users,
  Video,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DASHBOARD_NAV, APP_NAME } from "@/lib/constants"

const ICONS: Record<(typeof DASHBOARD_NAV)[number]["icon"], LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  video: Video,
  upload: Upload,
  "folder-input": FolderInput,
  "bar-chart-3": BarChart3,
  "message-square": MessageSquare,
  "columns-3": Columns3,
  users: Users,
  settings: Settings,
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link
          href="/dashboard"
          className="font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          onClick={onNavigate}
        >
          {APP_NAME}
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {DASHBOARD_NAV.map((item) => {
          const Icon = ICONS[item.icon]
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
