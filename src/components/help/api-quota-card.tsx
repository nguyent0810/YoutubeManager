import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const CONSOLE_APIS = "https://console.cloud.google.com/apis/library/youtube.googleapis.com"
const QUOTAS_DOC =
  "https://developers.google.com/youtube/v3/getting-started#quota"
const OAUTH_CONSENT =
  "https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps"

export function ApiQuotaCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">YouTube Data API &amp; quota</CardTitle>
        <CardDescription>
          Reads and writes use your Google project&apos;s quota. Errors like{" "}
          <span className="font-mono text-foreground">quotaExceeded</span>,{" "}
          <span className="font-mono text-foreground">403</span>, or{" "}
          <span className="font-mono text-foreground">429</span> usually mean
          quota limits, disabled API, or missing OAuth scopes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Enable <strong className="text-foreground">YouTube Data API v3</strong>{" "}
            for the OAuth client&apos;s project in Google Cloud Console.
          </li>
          <li>
            If permissions fail after a scope change, sign out of this app and
            sign in again so Google can show the consent screen.
          </li>
          <li>
            Default daily quota is shared across all users of your client ID;
            heavy bulk uploads can exhaust it—retry later or request a quota
            increase.
          </li>
        </ul>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
          <Link
            href={CONSOLE_APIS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            Cloud Console — API library
            <ExternalLink className="size-3.5" />
          </Link>
          <Link
            href={QUOTAS_DOC}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            Quota overview (docs)
            <ExternalLink className="size-3.5" />
          </Link>
          <Link
            href={OAUTH_CONSENT}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            OAuth &amp; scopes
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
