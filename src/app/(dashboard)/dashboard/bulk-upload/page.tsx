import { BulkUploadForm } from "@/components/upload/bulk-upload-form"
import Link from "next/link"

export default function BulkUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk upload</h1>
        <p className="text-sm text-muted-foreground">
          Add a whole folder (sorted by path) or multiple files, reorder the
          queue, then set title, description, and schedule per video. For a
          single file, use{" "}
          <Link
            href="/dashboard/upload"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Upload video
          </Link>
          .
        </p>
      </div>
      <BulkUploadForm />
    </div>
  )
}
