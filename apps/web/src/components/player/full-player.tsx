import { useState, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/contexts/player-context'
import { Slider } from '@/components/ui/slider'
import { WaveformSlider } from '@/components/ui/waveform-slider'
import { extractColorsFromImage } from '@/lib/color-extraction'
import { getAssetUrl } from '@/lib/utils'
import { AnimatedGradient } from './animated-gradient'
import { TrackCover } from '../tracks/track-cover'

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
    <AnimatedGradient colors={colors} blur className="min-h-screen">
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex justify-center">
            <TrackCover
              coverArtUrl={currentTrack.coverArtUrl}
              title={currentTrack.title}
              size="lg"
              className="w-96 h-96 rounded-2xl shadow-2xl"
            />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold text-white">
              {currentTrack.title}
            </h1>
            <p className="text-2xl text-white/80">
              {currentTrack.mainArtist || 'Unknown Artist'}
            </p>
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

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={previous}
              disabled={!hasPrevious}
              className="p-4 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <SkipBack className="h-8 w-8" />
            </button>
            <button
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              style={{ color: colors.primary }}
            >
              {isPlaying ? (
                <Pause className="h-10 w-10 fill-current" />
              ) : (
                <Play className="h-10 w-10 fill-current ml-1" />
              )}
            </button>
            <button
              onClick={next}
              disabled={!hasNext}
              className="p-4 text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <SkipForward className="h-8 w-8" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 bg-white/10 rounded-full px-6 py-3 mx-auto max-w-md">
            <button onClick={toggleMute} className="text-white">
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
              onValueChange={(value) => {
                setVolume(value[0])
                setIsMuted(value[0] === 0)
              }}
              className="flex-1"
            />
          </div>

          {queue.length > 1 && (
            <div className="text-center">
              <p className="text-sm text-white/60">
                Track {queueIndex + 1} of {queue.length}
              </p>
              {hasNext && (
                <p className="text-xs text-white/40 mt-1">
                  Next: {queue[queueIndex + 1].title}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedGradient>
  )
}
