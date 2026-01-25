import { createFileRoute } from '@tanstack/react-router'
import { Music2 } from 'lucide-react'
import { useUserPublicProfile, useUserPublicTracks } from '@/hooks/use-users'
import { usePlayer } from '@/contexts/player-context'
import { UserProfileHeader } from '@/components/profile/user-profile-header'
import { TrackList } from '@/components/tracks/track-list'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/common/empty-state'
import { normalizeUserPublicTrack } from '@/api/users'
import type { TrackWithUser } from '@/api/tracks'

export const Route = createFileRoute('/_authenticated/profile/$profileId/')({
  component: UserProfilePage,
})

function UserProfilePage() {
  const { profileId } = Route.useParams()
  const { currentTrack } = usePlayer()

  const { user, isLoading: isUserLoading, isError: isUserError } = useUserPublicProfile(profileId)

  const {
    tracks: rawTracks,
    isLoading: isTracksLoading,
    isError: isTracksError,
    error: tracksError,
  } = useUserPublicTracks(profileId)

  // Normalize tracks to TrackWithUser format for player compatibility
  const tracks: TrackWithUser[] = user
    ? rawTracks.map((track) =>
        normalizeUserPublicTrack(track, { id: user.id, username: user.username }),
      )
    : []

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (isUserError || !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Music2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <p className="text-muted-foreground">
          The user you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-8">
        <UserProfileHeader user={user} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Tracks</h2>

        {isTracksLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : isTracksError ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive">Error loading tracks</h3>
              <p className="text-muted-foreground mt-2">
                {tracksError instanceof Error ? tracksError.message : 'Failed to load tracks'}
              </p>
            </div>
          </div>
        ) : tracks.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="No public tracks"
            description={`${user.profile?.displayName || user.username} hasn't shared any tracks yet.`}
          />
        ) : (
          <div className="flex-1 min-h-0">
            <p className="text-sm text-muted-foreground mb-4">
              {tracks.length} track{tracks.length !== 1 ? 's' : ''}
            </p>
            <TrackList tracks={tracks} isOwner={false} currentPlayingTrackId={currentTrack?.id} />
          </div>
        )}
      </div>
    </div>
  )
}
