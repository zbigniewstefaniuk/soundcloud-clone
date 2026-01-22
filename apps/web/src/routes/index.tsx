import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Music2,
  Play,
  Pause,
  Heart,
  Headphones,
  Upload,
  TrendingUp,
  Sparkles,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrackCover } from '@/components/tracks/track-cover'
import { TrackStats } from '@/components/tracks/track-stats'
import {
  usePublicTracks,
  useBatchLikeStatus,
  useToggleLike,
  type GetTracksParams,
} from '@/hooks/use-tracks'
import { usePlayer } from '@/contexts/player-context'
import { useAccount } from '@/hooks/use-auth'
import type { TrackWithUser } from '@/api/tracks'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { user } = useAccount()

  return (
    <div className="min-h-screen">
      <HeroSection isLoggedIn={!!user} />
      <div className="space-y-4">
        <TrackSection
          title="Trending Now"
          subtitle="Most played tracks this week"
          icon={TrendingUp}
          sortBy="playCount"
        />
        <TrackSection
          title="Most Loved"
          subtitle="Tracks with the most likes"
          icon={Heart}
          sortBy="likeCount"
        />
        <TrackSection
          title="New Releases"
          subtitle="Fresh music from our community"
          icon={Sparkles}
          sortBy="createdAt"
        />
      </div>
      <FeaturesSection />
    </div>
  )
}

function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
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
                  <Link to="/auth/register">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

interface TrackSectionProps {
  title: string
  subtitle: string
  icon: LucideIcon
  sortBy: GetTracksParams['sortBy']
  pageSize?: number
}

function TrackSection({ title, subtitle, icon: Icon, sortBy, pageSize = 8 }: TrackSectionProps) {
  const { user } = useAccount()
  const { tracks, isLoading, isError, refetch } = usePublicTracks({
    sortBy,
    order: 'desc',
    pageSize,
  })
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()

  const trackIds = tracks.map((t) => t.id)
  const { likedMap } = useBatchLikeStatus(trackIds, !!user)
  const toggleLike = useToggleLike()

  const handlePlay = (track: TrackWithUser) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track, tracks)
    }
  }

  const handleLike = (trackId: string) => {
    if (!user) return
    const isLiked = likedMap[trackId] ?? false
    toggleLike.mutate({ trackId, isLiked })
  }

  return (
    <section className="py-12 relative">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/2 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: pageSize }).map((_, i) => (
              <TrackCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && <SectionError onRetry={() => refetch()} />}

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                isLiked={likedMap[track.id] ?? false}
                onPlay={() => handlePlay(track)}
                onLike={() => handleLike(track.id)}
                showLikeButton={!!user}
              />
            ))}
          </div>
        )}
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
    <section className="py-16 border-t border-border mt-8">
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

interface TrackCardProps {
  track: TrackWithUser
  isPlaying: boolean
  isLiked: boolean
  onPlay: () => void
  onLike: () => void
  showLikeButton: boolean
}

function TrackCard({ track, isPlaying, isLiked, onPlay, onLike, showLikeButton }: TrackCardProps) {
  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="relative aspect-square">
        <TrackCover coverArtUrl={track.coverArtUrl} title={track.title} size="full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button */}
        <button
          onClick={onPlay}
          className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" fill="currentColor" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          )}
        </button>

        {/* Like button */}
        {showLikeButton && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike()
            }}
            className={cn(
              'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
              isLiked
                ? 'bg-red-500 text-white'
                : 'bg-black/40 text-white opacity-0 group-hover:opacity-100',
            )}
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm truncate" title={track.title}>
          {track.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {track.mainArtist || track.user?.username}
        </p>
        <div className="mt-2">
          <TrackStats playCount={track.playCount} likeCount={track.likeCount} genre={track.genre} />
        </div>
      </div>
    </div>
  )
}

function TrackCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded-md animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded-md animate-pulse w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground mb-3">Failed to load tracks</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
