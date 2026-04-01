"use client"

import * as React from "react"
import { Send } from "lucide-react"
import type { YouTubeCommentThreadItem } from "@/lib/youtube"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCommentThreads,
  usePostCommentReply,
} from "@/hooks/use-comment-threads"
import { toast } from "@/components/ui/toast"

function stripYoutubeHtml(s: string) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim()
}

function CommentBlock({
  author,
  text,
  when,
}: {
  author: string
  text: string
  when: string
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
      <p className="font-medium text-foreground">{author}</p>
      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
        {stripYoutubeHtml(text)}
      </p>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {new Date(when).toLocaleString()}
      </p>
    </div>
  )
}

function ThreadCard({
  thread,
  draft,
  onDraftChange,
  onReply,
  posting,
}: {
  thread: YouTubeCommentThreadItem
  draft: string
  onDraftChange: (v: string) => void
  onReply: () => void
  posting: boolean
}) {
  const top = thread.snippet.topLevelComment
  const replies = thread.replies?.comments ?? []

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <CommentBlock
          author={top.snippet.authorDisplayName}
          text={top.snippet.textDisplay}
          when={top.snippet.publishedAt}
        />
        {replies.length > 0 ? (
          <div className="ml-4 space-y-2 border-l-2 border-border pl-3">
            {replies.map((c) => (
              <CommentBlock
                key={c.id}
                author={c.snippet.authorDisplayName}
                text={c.snippet.textDisplay}
                when={c.snippet.publishedAt}
              />
            ))}
          </div>
        ) : null}
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Write a reply…"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="button"
            size="sm"
            disabled={!draft.trim() || posting}
            onClick={onReply}
            className="gap-2"
          >
            <Send className="size-4" />
            {posting ? "Posting…" : "Reply"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function CommentThreadsList({ videoId }: { videoId: string | null }) {
  const threadsQuery = useCommentThreads(videoId ?? undefined)
  const postReply = usePostCommentReply()
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})

  const threads = React.useMemo(
    () =>
      threadsQuery.data?.pages.flatMap((p) => p.items ?? []) ?? [],
    [threadsQuery.data]
  )

  const setDraft = (threadId: string, value: string) => {
    setDrafts((d) => ({ ...d, [threadId]: value }))
  }

  const handleReply = (thread: YouTubeCommentThreadItem) => {
    const text = drafts[thread.id]?.trim()
    if (!text) return
    const parentId = thread.snippet.topLevelComment.id
    postReply.mutate(
      { parentId, textOriginal: text },
      {
        onSuccess: () => {
          toast.success("Reply posted.")
          setDrafts((d) => ({ ...d, [thread.id]: "" }))
        },
        onError: (e: Error) => toast.error(e.message),
      }
    )
  }

  if (!videoId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a video to load comments.
      </p>
    )
  }

  if (threadsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (threadsQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {threadsQuery.error instanceof Error
          ? threadsQuery.error.message
          : "Could not load comments"}
      </p>
    )
  }

  if (!threads.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No comments on this video yet, or comments are disabled.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          draft={drafts[thread.id] ?? ""}
          onDraftChange={(v) => setDraft(thread.id, v)}
          onReply={() => handleReply(thread)}
          posting={postReply.isPending}
        />
      ))}
      {threadsQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => threadsQuery.fetchNextPage()}
            disabled={threadsQuery.isFetchingNextPage}
          >
            {threadsQuery.isFetchingNextPage
              ? "Loading…"
              : "Load more comments"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
