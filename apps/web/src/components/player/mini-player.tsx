import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/contexts/player-context'
import { Slider } from '@/components/ui/slider'
import { WaveformSlider } from '@/components/ui/waveform-slider'
import { extractColorsFromImage } from '@/lib/color-extraction'
import { getAssetUrl } from '@/lib/utils'
import { AnimatedGradient } from './animated-gradient'
import { TrackCover } from '../tracks/track-cover'

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
    queue,
    queueIndex,
  } = usePlayer()

  const [colors, setColors] = useState({
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
  })

  const [isMuted, setIsMuted] = useState(false)

  const coverUrl = getAssetUrl(currentTrack?.coverArtUrl)

  useEffect(() => {
    if (coverUrl) {
      extractColorsFromImage(coverUrl).then(setColors)
    }
  }, [coverUrl])

  if (!currentTrack) {
    return null
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(volume || 0.5)
      setIsMuted(false)
    } else {
      setVolume(0)
      setIsMuted(true)
    }
  }

  const hasNext = queueIndex < queue.length - 1
  const hasPrevious = queueIndex > 0

  return (
    <AnimatedGradient
      colors={colors}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
    >
      <div className="backdrop-blur-sm bg-black/20">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              to="/player"
              className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <TrackCover
                coverArtUrl={currentTrack.coverArtUrl}
                title={currentTrack.title}
                size="sm"
                className="w-12 h-12"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-white/70 truncate">
                  {currentTrack.mainArtist || 'Unknown Artist'}
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={previous}
                disabled={!hasPrevious}
                className="p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={togglePlay}
                className="p-2 bg-white rounded-full hover:scale-105 transition-transform"
                style={{ color: colors.primary }}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </button>
              <button
                onClick={next}
                disabled={!hasNext}
                className="p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-xs text-white/70 tabular-nums">
                {formatTime(currentTime)}
              </span>
              <WaveformSlider
                value={currentTime}
                max={duration || 100}
                onValueChange={seek}
                isPlaying={isPlaying}
                className="flex-1"
                waveformHeight={24}
              />
              <span className="text-xs text-white/70 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white p-2">
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(value) => {
                  setVolume(value[0])
                  setIsMuted(value[0] === 0)
                }}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </AnimatedGradient>
  )
}
