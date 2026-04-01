import type { Metadata } from "next"
import { Syne, DM_Sans } from "next/font/google"
import Link from "next/link"
import { APP_NAME } from "@/lib/constants"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-marketing-display",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-marketing-body",
})

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — YouTube creator dashboard`, template: `%s | ${APP_NAME}` },
  description:
    "Manage your YouTube channel, videos, and stats in one polished dashboard. Google sign-in, fast search, and a focused creator workflow.",
  openGraph: {
    title: `${APP_NAME} — YouTube creator dashboard`,
    description:
      "Sign in with Google and manage your channel from a fast, modern web app.",
    type: "website",
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${syne.variable} ${dmSans.variable} min-h-screen bg-background`}
      style={{ fontFamily: "var(--font-marketing-body), system-ui, sans-serif" }}
    >
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-marketing-display)] text-lg font-bold tracking-tight"
          >
            {APP_NAME}
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Sign in
          </Link>
        </div>
      </header>
      {children}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>Built for creators. Read-only YouTube access with your Google account.</p>
      </footer>
    </div>
  )
}
