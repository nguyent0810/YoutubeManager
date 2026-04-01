import { SingleUploadForm } from "@/components/upload/single-upload-form"
import Link from "next/link"

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload video</h1>
        <p className="text-sm text-muted-foreground">
          Upload one file with its own title, description, and schedule. For many
          files from a folder, use{" "}
          <Link
            href="/dashboard/bulk-upload"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Bulk upload
          </Link>
          .
        </p>
      </div>
      <SingleUploadForm />
    </div>
  )
}
