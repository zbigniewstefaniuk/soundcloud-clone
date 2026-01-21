import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useUserTracks, useUserLikedTracks } from '@/hooks/use-tracks'
import { TrackList } from '@/components/tracks/track-list'
import { TrackSearchInput } from '@/components/tracks/track-search'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Music2, Heart, User } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { usePlayer } from '@/contexts/player-context'
import { useAccount } from '@/hooks/use-auth'
import type { TrackWithUser } from '@/api/tracks'

export const Route = createFileRoute('/_authenticated/profile/tracks')({
  component: ProfileTracksPage,
})

function ProfileTracksPage() {
  const { user } = useAccount()
  const [activeTab, setActiveTab] = useState('my-tracks')

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user?.username || 'My Profile'}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Link to="/tracks/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Track
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-tracks" className="gap-2">
            <Music2 className="h-4 w-4" />
            My Tracks
          </TabsTrigger>
          <TabsTrigger value="liked-tracks" className="gap-2">
            <Heart className="h-4 w-4" />
            Liked Tracks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-tracks">
          <MyTracksTab />
        </TabsContent>

        <TabsContent value="liked-tracks">
          <LikedTracksTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MyTracksTab() {
  const { tracks, isLoading, isError, error } = useUserTracks()
  const { playTrack, currentTrack, isPlaying, togglePlay, currentTime } = usePlayer()
  const [filteredTracks, setFilteredTracks] = useState<TrackWithUser[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const displayTracks = isSearching ? filteredTracks : tracks

  const handleFilteredTracksChange = (filtered: TrackWithUser[]) => {
    setFilteredTracks(filtered)
    setIsSearching(
      filtered.length !== tracks.length || filtered.some((t, i) => t.id !== tracks[i]?.id),
    )
  }

  const handlePlay = (track: TrackWithUser) => {
    if (currentTrack?.id === track.id && isPlaying) {
      togglePlay()
      return
    }
    if (currentTrack?.id === track.id && !isPlaying && currentTime > 0) {
      togglePlay()
      return
    }
    playTrack(track, displayTracks)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'Failed to load tracks'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {tracks.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <TrackSearchInput
            tracks={tracks}
            onFilteredTracksChange={handleFilteredTracksChange}
            placeholder="Search your tracks..."
            className="max-w-md"
          />
          <p className="text-sm text-muted-foreground">
            {isSearching
              ? `${displayTracks.length} of ${tracks.length} tracks`
              : `${tracks.length} track${tracks.length !== 1 ? `s` : ``}`}
          </p>
        </div>
      )}

      {tracks.length === 0 ? (
        <EmptyState
          icon={<Music2 className="h-12 w-12" />}
          title="No tracks yet"
          description="Upload your first track to get started"
          action={
            <Link to="/tracks/upload">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Track
              </Button>
            </Link>
          }
        />
      ) : displayTracks.length === 0 ? (
        <EmptyState
          icon={<Music2 className="h-12 w-12" />}
          title="No matches found"
          description="Try a different search term"
        />
      ) : (
        <TrackList
          tracks={displayTracks}
          isOwner={true}
          onTogglePlay={handlePlay}
          currentPlayingTrackId={currentTrack?.id}
        />
      )}
    </div>
  )
}

function LikedTracksTab() {
  const { tracks, isLoading, isError, error } = useUserLikedTracks()
  const { currentTrack } = usePlayer()
  const [filteredTracks, setFilteredTracks] = useState<TrackWithUser[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const displayTracks = isSearching ? filteredTracks : tracks

  const handleFilteredTracksChange = (filtered: TrackWithUser[]) => {
    setFilteredTracks(filtered)
    setIsSearching(
      filtered.length !== tracks.length || filtered.some((t, i) => t.id !== tracks[i]?.id),
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'Failed to load liked tracks'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {tracks.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <TrackSearchInput
            tracks={tracks}
            onFilteredTracksChange={handleFilteredTracksChange}
            placeholder="Search liked tracks..."
            className="max-w-md"
          />
          <p className="text-sm text-muted-foreground">
            {isSearching
              ? `${displayTracks.length} of ${tracks.length} tracks`
              : `${tracks.length} liked track${tracks.length !== 1 ? `s` : ``}`}
          </p>
        </div>
      )}

      {tracks.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="No liked tracks yet"
          description="Like some tracks to see them here"
          action={
            <Link to="/">
              <Button variant="outline">Discover Tracks</Button>
            </Link>
          }
        />
      ) : displayTracks.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="No matches found"
          description="Try a different search term"
        />
      ) : (
        <TrackList
          tracks={displayTracks}
          isOwner={false}
          currentPlayingTrackId={currentTrack?.id}
        />
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}
