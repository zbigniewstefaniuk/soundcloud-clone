import { createFileRoute, Link } from '@tanstack/react-router'
import { Music2, Play, Headphones, Upload, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrackCover } from '@/components/tracks/track-cover'
import { TrackStats } from '@/components/tracks/track-stats'
import { usePublicTracks } from '@/hooks/use-tracks'
import { usePlayer } from '@/contexts/player-context'
import { useAccount } from '@/hooks/use-auth'
import type { TrackWithUser } from '@/api/tracks'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { user } = useAccount()

  return (
    <div className="min-h-screen">
      <HeroSection isLoggedIn={!!user} />
      <FeaturesSection />
      <TracksSection />
    </div>
  )
}

function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 md:py-32">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Music2 className="h-4 w-4" />
            <span className="text-sm font-medium">Share your sound with the world</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Discover and share
            <span className="text-primary"> amazing music</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your tracks, discover new artists, and connect with a community of music lovers.
            Your next favorite song is waiting.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <>
                <Button size="lg" asChild>
                  <Link to="/tracks/upload">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Track
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/profile/tracks">
                    <Music2 className="h-5 w-5 mr-2" />
                    My Tracks
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/auth/register">
                    Get Started Free
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth/login">
                    Sign In
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Upload,
      title: 'Easy Upload',
      description: 'Drag and drop your tracks to share them instantly with the world.',
    },
    {
      icon: Headphones,
      title: 'High Quality Audio',
      description: 'Stream and share your music in crystal clear quality.',
    },
    {
      icon: TrendingUp,
      title: 'Track Analytics',
      description: 'See how your tracks are performing with play counts and likes.',
    },
  ]

  return (
    <section className="py-16 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TracksSection() {
  const { tracks, isLoading, isError } = usePublicTracks({
    pageSize: 8,
    sortBy: 'createdAt',
    order: 'desc'
  })
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()

  const handlePlay = (track: TrackWithUser) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track, tracks)
    }
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Latest Tracks</h2>
            <p className="text-muted-foreground mt-1">Fresh music from our community</p>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <TrackCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load tracks. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && tracks.length === 0 && (
          <div className="text-center py-12">
            <Music2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tracks yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to share your music!</p>
            <Button asChild>
              <Link to="/tracks/upload">Upload a Track</Link>
            </Button>
          </div>
        )}

        {!isLoading && !isError && tracks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={() => handlePlay(track)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

interface TrackCardProps {
  track: TrackWithUser
  isPlaying: boolean
  onPlay: () => void
}

function TrackCard({ track, isPlaying, onPlay }: TrackCardProps) {
  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
      <div className="relative aspect-square">
        <TrackCover
          coverArtUrl={track.coverArtUrl}
          title={track.title}
          size="full"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onPlay}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Play className={`h-6 w-6 ${isPlaying ? 'hidden' : ''}`} fill="currentColor" />
            {isPlaying && (
              <div className="flex gap-1">
                <span className="w-1 h-4 bg-current animate-pulse" />
                <span className="w-1 h-4 bg-current animate-pulse delay-75" />
                <span className="w-1 h-4 bg-current animate-pulse delay-150" />
              </div>
            )}
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium truncate" title={track.title}>
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {track.mainArtist || track.user?.username}
        </p>
        <div className="mt-2">
          <TrackStats
            playCount={track.playCount}
            likeCount={track.likeCount}
            genre={track.genre}
          />
        </div>
      </div>
    </div>
  )
}

function TrackCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
      </div>
    </div>
  )
}
