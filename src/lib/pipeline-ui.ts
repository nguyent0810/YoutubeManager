/** Mirrors Prisma `PipelineStatus` — kept here so client code does not import `@prisma/client`. */
export const PIPELINE_STATUSES = [
  "BACKLOG",
  "PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "SCHEDULED",
  "PUBLISHED",
] as const

export type PipelineStatusValue = (typeof PIPELINE_STATUSES)[number]

export const PIPELINE_COLUMN_ORDER: PipelineStatusValue[] = [
  ...PIPELINE_STATUSES,
]

export const PIPELINE_LABELS: Record<PipelineStatusValue, string> = {
  BACKLOG: "Backlog",
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
}
