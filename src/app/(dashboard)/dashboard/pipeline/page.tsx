"use client"

import { PipelineBoard } from "@/components/pipeline/pipeline-board"

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Plan videos from idea to published. Cards are stored in your Postgres
          database (same as saved replies).
        </p>
      </div>
      <PipelineBoard />
    </div>
  )
}
