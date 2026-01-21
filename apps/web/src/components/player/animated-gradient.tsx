import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ColorPalette {
  primary: string
  secondary: string
  accent: string
}

interface AnimatedGradientProps {
  colors: ColorPalette
  className?: string
  children?: React.ReactNode
  blur?: boolean
}

function hexToRgb(hex: string): [number, number, number] {
  const num = parseInt(hex.replace('#', ''), 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function interpolateColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ]
}

export function AnimatedGradient({
  colors,
  className,
  children,
  blur = false,
}: AnimatedGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const rgb = {
      primary: hexToRgb(colors.primary),
      secondary: hexToRgb(colors.secondary),
      accent: hexToRgb(colors.accent),
    }

    let time = 0
    const speed = 0.0004

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const t = (Math.sin(time) + 1) / 2
      const t2 = (Math.sin(time * 0.7) + 1) / 2

      const c1 = interpolateColor(rgb.primary, rgb.secondary, t)
      const c2 = interpolateColor(rgb.secondary, rgb.accent, t2)
      const c3 = interpolateColor(rgb.accent, rgb.primary, (t + t2) / 2)

      const cx = width * (0.3 + 0.4 * Math.sin(time * 0.5))
      const cy = height * (0.3 + 0.4 * Math.cos(time * 0.3))

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height))
      gradient.addColorStop(0, `rgb(${c1.join(',')})`)
      gradient.addColorStop(0.5, `rgb(${c2.join(',')})`)
      gradient.addColorStop(1, `rgb(${c3.join(',')})`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      time += speed * 16
      animationRef.current = requestAnimationFrame(draw)
    }

    resize()
    draw()

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [colors])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {blur && <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
