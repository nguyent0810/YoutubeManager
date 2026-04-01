import { BulkUploadForm } from "@/components/upload/bulk-upload-form"

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk upload</h1>
        <p className="text-sm text-muted-foreground">
          Queue multiple video files, set titles and scheduling once, and upload
          through your channel. Uses the YouTube Data API (quota applies).
        </p>
      </div>
      <BulkUploadForm />
    </div>
  )
}
