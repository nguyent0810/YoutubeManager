"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { PipelineStatusValue } from "@/lib/pipeline-ui"
import { queryKeys } from "@/lib/query-keys"

export interface PipelineItemDto {
  id: string
  userId: string
  title: string
  notes: string
  status: PipelineStatusValue
  dueDate: string | null
  youtubeVideoId: string | null
  createdAt: string
  updatedAt: string
}

async function fetchPipeline(): Promise<PipelineItemDto[]> {
  const res = await fetch("/api/pipeline")
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load pipeline"
    throw new Error(msg)
  }
  return (data as { items: PipelineItemDto[] }).items
}

export function usePipeline() {
  return useQuery({
    queryKey: queryKeys.pipeline,
    queryFn: fetchPipeline,
  })
}

export function useCreatePipelineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      title: string
      notes?: string
      status?: PipelineStatusValue
      dueDate?: string | null
      youtubeVideoId?: string | null
    }) => {
      const res = await fetch("/api/pipeline", {
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
      return data as PipelineItemDto
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pipeline })
    },
  })
}

export function useUpdatePipelineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      body: Partial<{
        title: string
        notes: string
        status: PipelineStatusValue
        dueDate: string | null
        youtubeVideoId: string | null
      }>
    }) => {
      const res = await fetch(`/api/pipeline/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args.body),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to update"
        throw new Error(msg)
      }
      return data as PipelineItemDto
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pipeline })
    },
  })
}

export function useDeletePipelineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pipeline/${id}`, { method: "DELETE" })
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
      void qc.invalidateQueries({ queryKey: queryKeys.pipeline })
    },
  })
}
