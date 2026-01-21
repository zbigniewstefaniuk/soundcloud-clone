import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  track: {
    height: 4,
    backgroundOpacity: 0.2,
    borderRadius: 2,
  },
  thumb: {
    size: 12,
  },
  wave: {
    /** Base animation speed */
    baseSpeed: 0.015,
    /** Wave opacity */
    opacity: 0.35,
    /** Step size for drawing */
    resolution: 1,
  },
  animation: {
    targetFps: 60,
  },
} as const

// ============================================================================
// Types
// ============================================================================

interface WaveformSliderProps {
  value: number
  max: number
  onValueChange: (value: number) => void
  isPlaying?: boolean
  className?: string
  waveformHeight?: number
}

interface RenderState {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  dpr: number
  width: number
  height: number
}

// ============================================================================
// Rendering Functions
// ============================================================================

function setupCanvas(canvas: HTMLCanvasElement): RenderState | null {
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return null

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const width = rect.width
  const height = rect.height

  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  return { canvas, ctx, dpr, width, height }
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  waveHeight: number,
  progress: number,
) {
  const { height, backgroundOpacity, borderRadius } = CONFIG.track
  const y = waveHeight

  ctx.fillStyle = `rgba(255, 255, 255, ${backgroundOpacity})`
  ctx.beginPath()
  ctx.roundRect(0, y, width, height, borderRadius)
  ctx.fill()

  if (progress > 0) {
    const filledWidth = width * progress
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.roundRect(0, y, filledWidth, height, borderRadius)
    ctx.fill()
  }
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  waveHeight: number,
  progress: number,
  phase: number,
) {
  if (progress <= 0) return

  const progressX = width * progress
  const { opacity, resolution } = CONFIG.wave

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, progressX, waveHeight)
  ctx.clip()

  const gradient = ctx.createLinearGradient(0, 0, 0, waveHeight)
  gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
  gradient.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.3})`)
  ctx.fillStyle = gradient

  ctx.beginPath()
  ctx.moveTo(0, waveHeight)

  for (let x = 0; x <= width; x += resolution) {
    const t = x / width

    // Envelope: fade in first 5%, full in middle, fade out last 5%
    const fadeInEnd = 0.05
    const fadeOutStart = 0.95
    let envelope = 1

    if (t < fadeInEnd) {
      // Smooth ease-in for first 5%
      const fadeT = t / fadeInEnd
      envelope = fadeT * fadeT * fadeT
    } else if (t > fadeOutStart) {
      // Smooth ease-out for last 5%
      const fadeT = (1 - t) / (1 - fadeOutStart)
      envelope = fadeT * fadeT * fadeT
    }

    // Higher frequency waves = more continuous waving motion
    const wave1 = Math.sin(t * Math.PI * 6 + phase) * 0.28
    const wave2 = Math.sin(t * Math.PI * 10 + phase * 1.3) * 0.2
    const wave3 = Math.sin(t * Math.PI * 14 + phase * 0.7) * 0.15
    const wave4 = Math.sin(t * Math.PI * 4 + phase * 1.5) * 0.22
    const wave5 = Math.sin(t * Math.PI * 8 + phase * 0.9) * 0.18

    const combined = (wave1 + wave2 + wave3 + wave4 + wave5) * envelope
    const y = waveHeight * (0.88 - combined * 0.75)

    ctx.lineTo(x, y)
  }

  ctx.lineTo(width, waveHeight)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function render(state: RenderState, waveHeight: number, progress: number, phase: number) {
  const { ctx, width, height } = state

  ctx.clearRect(0, 0, width, height)
  drawWave(ctx, width, waveHeight, progress, phase)
  drawTrack(ctx, width, waveHeight, progress)
}

// ============================================================================
// Component
// ============================================================================

export function WaveformSlider({
  value,
  max,
  onValueChange,
  isPlaying = false,
  className,
  waveformHeight = 32,
}: WaveformSliderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    renderState: null as RenderState | null,
    animationId: 0,
    phase: 0,
    lastFrameTime: 0,
  })

  const progress = max > 0 ? value / max : 0
  const totalHeight = waveformHeight + CONFIG.track.height

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = stateRef.current

    const handleResize = () => {
      state.renderState = setupCanvas(canvas)
      if (state.renderState) {
        render(state.renderState, waveformHeight, progress, state.phase)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [waveformHeight, progress])

  useEffect(() => {
    const state = stateRef.current
    const frameInterval = 1000 / CONFIG.animation.targetFps

    if (isPlaying) {
      const animate = (timestamp: number) => {
        const elapsed = timestamp - state.lastFrameTime

        if (elapsed >= frameInterval) {
          state.lastFrameTime = timestamp - (elapsed % frameInterval)
          state.phase += CONFIG.wave.baseSpeed

          if (state.renderState) {
            render(state.renderState, waveformHeight, progress, state.phase)
          }
        }

        state.animationId = requestAnimationFrame(animate)
      }

      state.animationId = requestAnimationFrame(animate)
    } else {
      if (state.renderState) {
        render(state.renderState, waveformHeight, progress, state.phase)
      }
    }

    return () => {
      if (state.animationId) {
        cancelAnimationFrame(state.animationId)
        state.animationId = 0
      }
    }
  }, [isPlaying, waveformHeight, progress])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    onValueChange(percentage * max)
  }

  return (
    <button
      className={cn('relative cursor-pointer select-none', className)}
      style={{ height: totalHeight }}
      onClick={handleClick}
      type="button"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div
        className="absolute bg-white rounded-full shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          width: CONFIG.thumb.size,
          height: CONFIG.thumb.size,
          left: `${progress * 100}%`,
          top: waveformHeight + CONFIG.track.height / 2,
        }}
      />
    </button>
  )
}
