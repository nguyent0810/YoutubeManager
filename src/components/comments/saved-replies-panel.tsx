"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useCreateSavedReply,
  useDeleteSavedReply,
  useSavedReplies,
} from "@/hooks/use-saved-replies"
import { useOrgCurrent } from "@/hooks/use-org"
import { orgRoleAtLeast } from "@/lib/org-role"
import { toast } from "@/components/ui/toast"

export function SavedRepliesPanel({
  onInsert,
}: {
  onInsert: (text: string) => void
}) {
  const query = useSavedReplies()
  const orgQ = useOrgCurrent()
  const create = useCreateSavedReply()
  const del = useDeleteSavedReply()
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const canMutate = orgRoleAtLeast(orgQ.data?.activeRole, "MEMBER")

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    create.mutate(
      { title: title.trim(), body: body.trim() },
      {
        onSuccess: () => {
          toast.success("Saved reply added.")
          setTitle("")
          setBody("")
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  if (query.isError) {
    const msg =
      query.error instanceof Error ? query.error.message : "Failed to load"
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">Saved replies</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{msg}</p>
          <p className="mt-2">
            Add <code className="rounded bg-muted px-1">DATABASE_URL</code>{" "}
            (Postgres) and run{" "}
            <code className="rounded bg-muted px-1">npx prisma migrate deploy</code>{" "}
            to enable canned replies.
          </p>
        </CardContent>
      </Card>
    )
  }

  const rows = query.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saved replies</CardTitle>
        <p className="text-xs text-muted-foreground">
          Reuse text when replying to comments. Click “Use” to paste into the
          reply box.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {canMutate ? (
          <form onSubmit={handleCreate} className="space-y-2">
            <Input
              placeholder="Short label"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Reply text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="sm"
              disabled={create.isPending || !title.trim() || !body.trim()}
            >
              {create.isPending ? "Saving…" : "Save template"}
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground">
            Viewer role: you can use templates but not edit them. Ask an owner
            to change your role on Team.
          </p>
        )}

        <ul className="space-y-2">
          {query.isLoading ? (
            <li className="text-sm text-muted-foreground">Loading…</li>
          ) : rows.length === 0 ? (
            <li className="text-sm text-muted-foreground">No templates yet.</li>
          ) : (
            rows.map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-2 rounded-md border border-border p-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                    {r.body}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onInsert(r.body)}
                    >
                      Use
                    </Button>
                    {canMutate ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        aria-label={`Delete ${r.title}`}
                        onClick={() =>
                          del.mutate(r.id, {
                            onError: (err: Error) => toast.error(err.message),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
