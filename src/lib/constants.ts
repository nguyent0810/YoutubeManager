export const APP_NAME = "YTM Web"

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview", icon: "layout-dashboard" as const },
  { href: "/dashboard/videos", label: "Videos", icon: "video" as const },
  { href: "/dashboard/analytics", label: "Analytics", icon: "bar-chart-3" as const },
  { href: "/dashboard/comments", label: "Comments", icon: "message-square" as const },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: "columns-3" as const },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" as const },
] as const
