import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Heart,
  Repeat,
  Repeat1,
  Shuffle,
} from 'lucide-react'
import { usePlayer } from '@/contexts/player-context'
import { Slider } from '@/components/ui/slider'
import { WaveformSlider } from '@/components/ui/waveform-slider'
import { cn, formatTime } from '@/lib/utils'
import { useCoverColors } from '@/hooks/use-cover-colors'
import { AnimatedGradient } from './animated-gradient'
import { TrackCover } from '../tracks/track-cover'
import { ArtistName } from '../tracks/artist-name'
import { useTrackLike } from '@/hooks/use-track-like'

export function FullPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    queue,
    queueIndex,
    hasNext,
    hasPrevious,
    isMuted,
    toggleMute,
    repeatMode,
    cycleRepeatMode,
    isShuffled,
    toggleShuffle,
  } = usePlayer()

  const { isLiked, toggleLike, canLike } = useTrackLike(currentTrack?.id)
  const colors = useCoverColors(currentTrack?.coverArtUrl)

  if (!currentTrack) {
    return null
  }

  return (
    <AnimatedGradient colors={colors} className="min-h-screen">
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex justify-center">
            <div className="relative group">
              <TrackCover
                coverArtUrl={currentTrack.coverArtUrl}
                title={currentTrack.title}
                size="lg"
                className="w-96 h-96 rounded-2xl shadow-2xl"
              />
              <button
                onClick={toggleLike}
                disabled={!canLike}
                className={cn(
                  'absolute bottom-4 right-4 p-3 rounded-full backdrop-blur-sm transition-all',
                  'opacity-0 group-hover:opacity-100 hover:scale-110',
                  !canLike && 'opacity-30 cursor-not-allowed group-hover:opacity-30',
                  isLiked
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-black/30 text-white/70 hover:text-white',
                )}
                title={!canLike ? 'Login to like' : isLiked ? 'Unlike' : 'Like'}
              >
                <Heart className={cn('h-7 w-7', isLiked && 'fill-current')} />
              </button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold text-white">{currentTrack.title}</h1>
            <ArtistName
              user={currentTrack.user}
              collaborators={currentTrack.collaborators}
              className="text-2xl text-white/80"
            />
            {currentTrack.description && (
              <p className="text-lg text-white/60 line-clamp-2 max-w-2xl mx-auto mt-4">
                {currentTrack.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <WaveformSlider
              value={currentTime}
              max={duration || 100}
              onValueChange={seek}
              isPlaying={isPlaying}
              className="w-full"
              waveformHeight={48}
            />
            <div className="flex justify-between text-sm text-white/80 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleShuffle}
              className={cn(
                'p-3 rounded-full transition-all hover:bg-white/10',
                isShuffled ? 'text-primary' : 'text-white/50',
              )}
              title={isShuffled ? 'Shuffle on' : 'Shuffle off'}
            >
              <Shuffle className="h-6 w-6" />
            </button>
            <button
              onClick={previous}
              disabled={!hasPrevious && repeatMode === 'off'}
              className="p-4 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <SkipBack className="h-8 w-8" />
            </button>
            <button
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-white text-primary flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? (
                <Pause className="h-10 w-10 fill-current" />
              ) : (
                <Play className="h-10 w-10 fill-current ml-1" />
              )}
            </button>
            <button
              onClick={next}
              disabled={!hasNext && repeatMode === 'off'}
              className="p-4 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <SkipForward className="h-8 w-8" />
            </button>
            <button
              onClick={cycleRepeatMode}
              className={cn(
                'p-3 rounded-full transition-all hover:bg-white/10',
                repeatMode !== 'off' ? 'text-primary' : 'text-white/50',
              )}
              title={`Repeat: ${repeatMode === 'off' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="h-6 w-6" />
              ) : (
                <Repeat className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 bg-white/10 rounded-full px-6 py-3 mx-auto max-w-md">
            <button
              onClick={toggleMute}
              className="text-white hover:text-white/80 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-6 w-6" />
              ) : (
                <Volume2 className="h-6 w-6" />
              )}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={(value) => setVolume(value[0])}
              className="flex-1"
            />
          </div>

          {queue.length > 1 && (
            <div className="text-center">
              <p className="text-sm text-white/60">
                Track {queueIndex + 1} of {queue.length}
              </p>
              {hasNext && (
                <p className="text-xs text-white/40 mt-1">Next: {queue[queueIndex + 1].title}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedGradient>
  )
}
