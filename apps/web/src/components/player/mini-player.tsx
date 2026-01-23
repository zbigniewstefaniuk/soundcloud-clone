import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
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
import { extractColorsFromImage } from '@/lib/color-extraction'
import { cn, formatTime, getAssetUrl } from '@/lib/utils'
import { AnimatedGradient } from './animated-gradient'
import { TrackCover } from '../tracks/track-cover'
import { useTrackLike } from '@/hooks/use-track-like'

export function MiniPlayer() {
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
    hasNext,
    hasPrevious,
    toggleMute,
    isMuted,
    repeatMode,
    cycleRepeatMode,
    isShuffled,
    toggleShuffle,
  } = usePlayer()

  const { isLiked, toggleLike, canLike } = useTrackLike(currentTrack?.id)

  const [colors, setColors] = useState({
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
  })

  const coverUrl = getAssetUrl(currentTrack?.coverArtUrl)

  useEffect(() => {
    if (coverUrl) {
      extractColorsFromImage(coverUrl).then(setColors)
    }
  }, [coverUrl])

  if (!currentTrack) {
    return null
  }

  return (
    <AnimatedGradient
      colors={colors}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
    >
      <div className="backdrop-blur-sm bg-black/20">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Track info with like button overlay */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link to="/player" className="relative shrink-0 group">
                <TrackCover
                  coverArtUrl={currentTrack.coverArtUrl}
                  title={currentTrack.title}
                  size="sm"
                  className="w-12 h-12"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    toggleLike()
                  }}
                  disabled={!canLike}
                  className={cn(
                    'absolute inset-0 flex items-center justify-center',
                    'bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg',
                    !canLike && 'cursor-not-allowed',
                  )}
                  title={!canLike ? 'Login to like' : isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isLiked ? 'text-destructive fill-current' : 'text-white',
                    )}
                  />
                </button>
              </Link>
              <Link to="/player" className="min-w-0 flex-1 hover:opacity-80 transition-opacity">
                <div className="text-sm font-medium text-white truncate">{currentTrack.title}</div>
                <div className="text-xs text-white/70 truncate">
                  {currentTrack.mainArtist || 'Unknown Artist'}
                </div>
              </Link>
            </div>

            {/* Playback controls - symmetrical layout */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleShuffle}
                className={cn(
                  'p-2 rounded-full transition-colors hover:bg-white/10',
                  isShuffled ? 'text-primary' : 'text-white/50',
                )}
                title={isShuffled ? 'Shuffle on' : 'Shuffle off'}
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                onClick={previous}
                disabled={!hasPrevious && repeatMode === 'off'}
                className="p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={togglePlay}
                className="p-2 bg-white text-primary rounded-full hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </button>
              <button
                onClick={next}
                disabled={!hasNext && repeatMode === 'off'}
                className="p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="h-5 w-5" />
              </button>
              <button
                onClick={cycleRepeatMode}
                className={cn(
                  'p-2 rounded-full transition-colors hover:bg-white/10',
                  repeatMode !== 'off' ? 'text-primary' : 'text-white/50',
                )}
                title={`Repeat: ${repeatMode === 'off' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>
            </div>

            {/* Waveform */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-xs text-white/70 tabular-nums">{formatTime(currentTime)}</span>
              <WaveformSlider
                value={currentTime}
                max={duration || 100}
                onValueChange={seek}
                isPlaying={isPlaying}
                className="flex-1"
                waveformHeight={24}
              />
              <span className="text-xs text-white/70 tabular-nums">{formatTime(duration)}</span>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(value) => setVolume(value[0])}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </AnimatedGradient>
  )
}
