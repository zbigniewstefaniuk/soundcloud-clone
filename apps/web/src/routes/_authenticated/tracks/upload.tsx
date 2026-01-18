import { createFileRoute } from '@tanstack/react-router'
import { UploadTrackForm } from '@/components/tracks/upload-track-form'

export const Route = createFileRoute('/_authenticated/tracks/upload')({
  component: UploadTrackPage,
})

function UploadTrackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <UploadTrackForm />
    </div>
  )
}
