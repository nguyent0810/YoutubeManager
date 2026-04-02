"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

export interface OrgListEntry {
  id: string
  name: string
  role: string
}

export interface OrgCurrentResponse {
  activeOrganizationId: string
  activeRole: string | null
  organizations: OrgListEntry[]
}

async function fetchOrgCurrent(): Promise<OrgCurrentResponse> {
  const res = await fetch("/api/orgs/current")
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load workspace"
    throw new Error(msg)
  }
  return data as OrgCurrentResponse
}

export function useOrgCurrent() {
  return useQuery({
    queryKey: queryKeys.orgCurrent,
    queryFn: fetchOrgCurrent,
  })
}

export interface OrgFeaturesResponse {
  exports: boolean
  youtube_writes: boolean
  ai_features: boolean
}

async function fetchOrgFeatures(): Promise<OrgFeaturesResponse> {
  const res = await fetch("/api/orgs/current/features")
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load features"
    throw new Error(msg)
  }
  return data as OrgFeaturesResponse
}

export function useOrgFeatures() {
  return useQuery({
    queryKey: queryKeys.orgFeatures,
    queryFn: fetchOrgFeatures,
  })
}

export interface AiStatusResponse {
  configured: boolean
  orgEnabled: boolean
  userOptIn: boolean
  allowed: boolean
}

async function fetchAiStatus(): Promise<AiStatusResponse> {
  const res = await fetch("/api/orgs/current/ai-status")
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to load AI status"
    throw new Error(msg)
  }
  return data as AiStatusResponse
}

export function useAiStatus() {
  return useQuery({
    queryKey: queryKeys.aiStatus,
    queryFn: fetchAiStatus,
  })
}
