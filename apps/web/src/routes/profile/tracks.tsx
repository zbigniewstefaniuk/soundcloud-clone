import { createFileRoute, Link } from '@tanstack/react-router'
import { useUserTracks } from '@/hooks/use-tracks'
import { TrackList } from '@/components/tracks/track-list'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { usePlayer } from '@/contexts/player-context'
import type { TrackWithUser } from '@/api/tracks'

export const Route = createFileRoute('/profile/tracks')({
  component: ProfileTracksPage,
})

function ProfileTracksPage() {
  const { tracks, isLoading, isError, error } = useUserTracks()
  const { playTrack } = usePlayer()

  const handlePlay = (track: TrackWithUser) => {
    playTrack(track, tracks)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600 mt-2">
            {error instanceof Error ? error.message : 'Failed to load tracks'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Tracks</h1>
          <p className="text-gray-500 mt-1">{tracks.length} track(s)</p>
        </div>
        <Link to="/tracks/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Track
          </Button>
        </Link>
      </div>

      <TrackList tracks={tracks} isOwner={true} onPlay={handlePlay} />
    </div>
  )
}
