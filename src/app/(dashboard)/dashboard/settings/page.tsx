"use client"

import { signOut, useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LogOut } from "lucide-react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const user = session?.user

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Appearance and account for this browser session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Light, dark, or follow your system. Transitions respect reduced motion.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in with Google via NextAuth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" ? (
            <p className="text-sm text-muted-foreground">Loading session…</p>
          ) : user ? (
            <div className="flex items-center gap-4">
              <Avatar
                src={user.image}
                alt={user.name ?? ""}
                fallback={user.name ?? user.email ?? "?"}
                size="lg"
              />
              <div className="min-w-0">
                <p className="font-medium">{user.name}</p>
                {user.email ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active session.</p>
          )}
          <Button
            type="button"
            variant="destructive"
            className="gap-2"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
