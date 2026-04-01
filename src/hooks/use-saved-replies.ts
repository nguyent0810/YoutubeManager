"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

export interface SavedReplyRow {
  id: string
  userId: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

async function fetchSavedReplies(): Promise<SavedReplyRow[]> {
  const res = await fetch("/api/saved-replies")
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load saved replies"
    throw new Error(msg)
  }
  return (data as { replies: SavedReplyRow[] }).replies
}

export function useSavedReplies() {
  return useQuery({
    queryKey: queryKeys.savedReplies,
    queryFn: fetchSavedReplies,
  })
}

export function useCreateSavedReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { title: string; body: string }) => {
      const res = await fetch("/api/saved-replies", {
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
            : "Failed to create"
        throw new Error(msg)
      }
      return data as SavedReplyRow
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.savedReplies })
    },
  })
}

export function useDeleteSavedReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/saved-replies/${id}`, { method: "DELETE" })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to delete"
        throw new Error(msg)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.savedReplies })
    },
  })
}
