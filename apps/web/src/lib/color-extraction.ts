interface ColorPalette {
  primary: string
  secondary: string
  accent: string
}

interface ColorBucket {
  redSum: number
  greenSum: number
  blueSum: number
  saturationSum: number
  pixelCount: number
}

interface ScoredColor {
  red: number
  green: number
  blue: number
  hue: number
  score: number
}

const DEFAULT_PALETTE: ColorPalette = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#ec4899',
}

const SAMPLE_SIZE = 50
const HUE_BUCKET_COUNT = 12
const HUE_BUCKET_SIZE = 360 / HUE_BUCKET_COUNT
const MIN_HUE_DIFFERENCE = 30
const MIN_BRIGHTNESS = 20
const MAX_BRIGHTNESS = 235
const MIN_ALPHA = 128

function rgbToHex(red: number, green: number, blue: number): string {
  return '#' + ((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1)
}

function calculateHue(red: number, green: number, blue: number): number {
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  if (max === min) return 0

  const delta = max - min
  let hue = 0

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0)
  } else if (max === green) {
    hue = (blue - red) / delta + 2
  } else {
    hue = (red - green) / delta + 4
  }

  return hue * 60
}

function getHueDifference(hue1: number, hue2: number): number {
  const diff = Math.abs(hue1 - hue2)
  return Math.min(diff, 360 - diff)
}

function createEmptyBucket(): ColorBucket {
  return { redSum: 0, greenSum: 0, blueSum: 0, saturationSum: 0, pixelCount: 0 }
}

function bucketToScoredColor(bucket: ColorBucket): ScoredColor {
  const red = Math.round(bucket.redSum / bucket.pixelCount)
  const green = Math.round(bucket.greenSum / bucket.pixelCount)
  const blue = Math.round(bucket.blueSum / bucket.pixelCount)
  const avgSaturation = bucket.saturationSum / bucket.pixelCount

  return {
    red,
    green,
    blue,
    hue: calculateHue(red, green, blue),
    score: bucket.pixelCount * (avgSaturation + 0.1),
  }
}

function selectDiverseColors(sortedColors: ScoredColor[]): ScoredColor[] {
  const selected = [sortedColors[0]]

  for (const color of sortedColors.slice(1)) {
    if (selected.length >= 3) break
    const isDifferentEnough = selected.every(
      (picked) => getHueDifference(picked.hue, color.hue) >= MIN_HUE_DIFFERENCE
    )
    if (isDifferentEnough) {
      selected.push(color)
    }
  }

  for (const color of sortedColors) {
    if (selected.length >= 3) break
    if (!selected.includes(color)) {
      selected.push(color)
    }
  }

  return selected
}

function colorToHex(color: ScoredColor | undefined, fallback: ScoredColor): string {
  const { red, green, blue } = color ?? fallback
  return rgbToHex(red, green, blue)
}

export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return resolve(DEFAULT_PALETTE)

      canvas.width = SAMPLE_SIZE
      canvas.height = SAMPLE_SIZE
      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

      const { data: pixelData } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
      const buckets: ColorBucket[] = Array.from({ length: HUE_BUCKET_COUNT }, createEmptyBucket)

      for (let i = 0; i < pixelData.length; i += 16) {
        const red = pixelData[i]
        const green = pixelData[i + 1]
        const blue = pixelData[i + 2]
        const alpha = pixelData[i + 3]

        if (alpha < MIN_ALPHA) continue

        const maxChannel = Math.max(red, green, blue)
        const minChannel = Math.min(red, green, blue)
        const brightness = (maxChannel + minChannel) / 2

        if (brightness < MIN_BRIGHTNESS || brightness > MAX_BRIGHTNESS) continue

        const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel
        const hue = calculateHue(red, green, blue)
        const bucketIndex = Math.floor(hue / HUE_BUCKET_SIZE) % HUE_BUCKET_COUNT
        const bucket = buckets[bucketIndex]

        bucket.redSum += red
        bucket.greenSum += green
        bucket.blueSum += blue
        bucket.saturationSum += saturation
        bucket.pixelCount++
      }

      const scoredColors = buckets
        .filter((bucket) => bucket.pixelCount > 0)
        .map(bucketToScoredColor)
        .sort((a, b) => b.score - a.score)

      if (scoredColors.length === 0) return resolve(DEFAULT_PALETTE)

      const selectedColors = selectDiverseColors(scoredColors)

      resolve({
        primary: colorToHex(selectedColors[0], selectedColors[0]),
        secondary: colorToHex(selectedColors[1], selectedColors[0]),
        accent: colorToHex(selectedColors[2], selectedColors[0]),
      })
    }

    img.onerror = () => resolve(DEFAULT_PALETTE)
    img.src = imageUrl
  })
}
