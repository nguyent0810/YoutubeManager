"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Send } from "lucide-react"
import type { YouTubeCommentThreadItem } from "@/lib/youtube"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCommentThreads,
  usePostCommentReply,
} from "@/hooks/use-comment-threads"
import { useAiStatus } from "@/hooks/use-org"
import { toast } from "@/components/ui/toast"
import { queryKeys } from "@/lib/query-keys"

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

type ModerationFilter = "all" | "unreplied" | "assigned_to_me"

function ThreadCard({
  thread,
  draft,
  onDraftChange,
  onReply,
  posting,
  assigneeUserId,
  members,
  onAssigneeChange,
  assignPending,
  aiAllowed,
  polishBusy,
  onPolish,
}: {
  thread: YouTubeCommentThreadItem
  draft: string
  onDraftChange: (v: string) => void
  onReply: () => void
  posting: boolean
  assigneeUserId: string | null
  members: { userId: string; role: string }[]
  onAssigneeChange: (userId: string | null) => void
  assignPending: boolean
  aiAllowed: boolean
  polishBusy: boolean
  onPolish: (mode: "shorten" | "expand" | "friendly" | "formal") => void
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor={`assign-${thread.id}`}
            >
              Assign reply (workspace)
            </label>
            <select
              id={`assign-${thread.id}`}
              value={assigneeUserId ?? ""}
              disabled={assignPending}
              onChange={(e) => {
                const v = e.target.value
                onAssigneeChange(v ? v : null)
              }}
              className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— Unassigned —</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.userId.slice(0, 10)}… ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Write a reply…"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {aiAllowed && draft.trim() ? (
            <div className="flex flex-wrap gap-2">
              <span className="w-full text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                AI polish (draft)
              </span>
              {(
                [
                  ["shorten", "Shorter"],
                  ["expand", "Expand"],
                  ["friendly", "Friendly"],
                  ["formal", "Formal"],
                ] as const
              ).map(([mode, label]) => (
                <Button
                  key={mode}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={polishBusy || posting}
                  onClick={() => onPolish(mode)}
                >
                  {label}
                </Button>
              ))}
            </div>
          ) : null}
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

export function CommentThreadsList({
  videoId,
  organizationId,
}: {
  videoId: string | null
  organizationId: string | null
}) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const aiQ = useAiStatus()
  const threadsQuery = useCommentThreads(videoId ?? undefined)
  const postReply = usePostCommentReply()
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})
  const [filter, setFilter] = React.useState<ModerationFilter>("all")
  const [polishThreadId, setPolishThreadId] = React.useState<string | null>(null)

  const membersQ = useQuery({
    queryKey: ["orgs", organizationId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${organizationId}/members`)
      const data = (await res.json()) as {
        error?: string
        members?: { userId: string; role: string }[]
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to load members")
      return data.members ?? []
    },
    enabled: !!organizationId && !!videoId,
  })

  const assignQ = useQuery({
    queryKey: queryKeys.commentAssignments(videoId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/orgs/current/comment-assignments?videoId=${encodeURIComponent(videoId!)}`
      )
      const data = (await res.json()) as {
        error?: string
        assignments?: { threadId: string; assigneeUserId: string | null }[]
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to load assignments")
      return data.assignments ?? []
    },
    enabled: !!organizationId && !!videoId,
  })

  const saveAssign = useMutation({
    mutationFn: async (body: {
      videoId: string
      threadId: string
      assigneeUserId: string | null
    }) => {
      const res = await fetch("/api/orgs/current/comment-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not save assignment"
        throw new Error(msg)
      }
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: queryKeys.commentAssignments(videoId ?? ""),
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const threads = React.useMemo(
    () => threadsQuery.data?.pages.flatMap((p) => p.items ?? []) ?? [],
    [threadsQuery.data]
  )

  const assignMap = React.useMemo(() => {
    const m = new Map<string, string | null>()
    for (const a of assignQ.data ?? []) {
      m.set(a.threadId, a.assigneeUserId)
    }
    return m
  }, [assignQ.data])

  const filteredThreads = React.useMemo(() => {
    const uid = session?.user?.id
    let list = threads
    if (filter === "unreplied") {
      list = list.filter((t) => (t.snippet.totalReplyCount ?? 0) === 0)
    }
    if (filter === "assigned_to_me" && uid) {
      list = list.filter((t) => assignMap.get(t.id) === uid)
    }
    return list
  }, [threads, filter, session?.user?.id, assignMap])

  const setDraft = (threadId: string, value: string) => {
    setDrafts((d) => ({ ...d, [threadId]: value }))
  }

  const runPolish = async (
    threadId: string,
    mode: "shorten" | "expand" | "friendly" | "formal"
  ) => {
    const text = drafts[threadId]?.trim()
    if (!text) return
    setPolishThreadId(threadId)
    try {
      const res = await fetch("/api/ai/reply-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      })
      const data = (await res.json()) as { error?: string; text?: string }
      if (!res.ok) {
        throw new Error(data.error ?? "AI polish failed")
      }
      if (typeof data.text === "string") {
        setDraft(threadId, data.text)
        toast.success("Draft updated — review before sending.")
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI polish failed")
    } finally {
      setPolishThreadId(null)
    }
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>Moderation</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ModerationFilter)}
            className="h-9 max-w-xs rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">All threads</option>
            <option value="unreplied">No replies yet</option>
            <option value="assigned_to_me">Assigned to me</option>
          </select>
        </label>
        {filter !== "all" && filteredThreads.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No threads match this filter.
          </p>
        ) : null}
      </div>

      {filteredThreads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          draft={drafts[thread.id] ?? ""}
          onDraftChange={(v) => setDraft(thread.id, v)}
          onReply={() => handleReply(thread)}
          posting={postReply.isPending}
          assigneeUserId={assignMap.get(thread.id) ?? null}
          members={membersQ.data ?? []}
          onAssigneeChange={(userId) => {
            saveAssign.mutate({
              videoId,
              threadId: thread.id,
              assigneeUserId: userId,
            })
          }}
          assignPending={saveAssign.isPending}
          aiAllowed={Boolean(aiQ.data?.allowed)}
          polishBusy={polishThreadId === thread.id}
          onPolish={(mode) => void runPolish(thread.id, mode)}
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
