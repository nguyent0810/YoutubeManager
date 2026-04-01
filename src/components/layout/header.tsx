"use client"

import { signOut, useSession } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { MobileNav } from "@/components/layout/mobile-nav"

export function DashboardHeader() {
  const { data: session, status } = useSession()
  const user = session?.user
  const image = user?.image ?? undefined
  const name = user?.name ?? user?.email ?? "Account"

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="hidden text-sm font-medium text-muted-foreground md:block">
          Creator workspace
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {status === "loading" ? (
          <div className="size-9 rounded-full bg-muted" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full p-0"
                aria-label="Account menu"
              >
                <Avatar src={image} alt={name} fallback={name} size="md" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{name}</p>
                {user?.email && (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
              <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="mr-2 inline size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
