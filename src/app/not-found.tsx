import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        That route does not exist. Head home or open your dashboard.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
