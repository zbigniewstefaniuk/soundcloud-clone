import { createFileRoute } from '@tanstack/react-router'
import { useTrack } from '@/hooks/use-tracks'
import { Spinner } from '@/components/ui/spinner'
import { TrackForm } from '@/components/tracks/track-form'
import { getAssetUrl } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/tracks/$trackId/edit')({
  component: EditTrackPage,
})

function EditTrackPage() {
  const { trackId } = Route.useParams()
  const { track, isLoading, isError } = useTrack(trackId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (isError || !track) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground mt-2">Track not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <TrackForm
        mode="edit"
        trackId={trackId}
        initialData={{
          title: track.title,
          description: track.description ?? undefined,
          genre: track.genre ?? undefined,
          isPublic: track.isPublic,
        }}
        existingCoverArtUrl={getAssetUrl(track.coverArtUrl) ?? undefined}
      />
    </div>
  )
}
