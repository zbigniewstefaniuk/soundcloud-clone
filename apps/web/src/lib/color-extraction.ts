interface RGB {
  r: number
  g: number
  b: number
}

interface ColorPalette {
  primary: string
  secondary: string
  accent: string
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((x) => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    })
    .join('')}`
}

function getBrightness(rgb: RGB): number {
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
}

function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
  )
}

function quantizeColors(pixels: RGB[], colorCount: number): RGB[] {
  const sortByChannel = (colors: RGB[], channel: 'r' | 'g' | 'b') => {
    return [...colors].sort((a, b) => a[channel] - b[channel])
  }

  const split = (colors: RGB[]): RGB[][] => {
    if (colors.length <= colorCount) {
      return [colors]
    }

    const channels: ('r' | 'g' | 'b')[] = ['r', 'g', 'b']
    let maxVariance = 0
    let maxChannel: 'r' | 'g' | 'b' = 'r'

    for (const channel of channels) {
      const values = colors.map((c) => c[channel])
      const variance = Math.max(...values) - Math.min(...values)
      if (variance > maxVariance) {
        maxVariance = variance
        maxChannel = channel
      }
    }

    const sorted = sortByChannel(colors, maxChannel)
    const mid = Math.floor(sorted.length / 2)

    return [...split(sorted.slice(0, mid)), ...split(sorted.slice(mid))]
  }

  const buckets = split(pixels)

  return buckets.slice(0, colorCount).map((bucket) => {
    const sum = bucket.reduce(
      (acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b,
      }),
      { r: 0, g: 0, b: 0 }
    )

    return {
      r: Math.round(sum.r / bucket.length),
      g: Math.round(sum.g / bucket.length),
      b: Math.round(sum.b / bucket.length),
    }
  })
}

export async function extractColorsFromImage(
  imageUrl: string
): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve({
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#ec4899',
        })
        return
      }

      const scale = 0.25
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels: RGB[] = []

      for (let i = 0; i < imageData.data.length; i += 40) {
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]
        const a = imageData.data[i + 3]

        if (
          a > 125 &&
          getBrightness({ r, g, b }) > 20 &&
          getBrightness({ r, g, b }) < 235
        ) {
          pixels.push({ r, g, b })
        }
      }

      if (pixels.length === 0) {
        resolve({
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#ec4899',
        })
        return
      }

      const dominantColors = quantizeColors(pixels, 5)

      const sortedByVibrancy = dominantColors.sort((a, b) => {
        const satA = Math.max(a.r, a.g, a.b) - Math.min(a.r, a.g, a.b)
        const satB = Math.max(b.r, b.g, b.b) - Math.min(b.r, b.g, b.b)
        return satB - satA
      })

      const selectedColors: RGB[] = [sortedByVibrancy[0]]

      for (const color of sortedByVibrancy.slice(1)) {
        const minDistance = Math.min(
          ...selectedColors.map((c) => colorDistance(c, color))
        )
        if (minDistance > 60 && selectedColors.length < 3) {
          selectedColors.push(color)
        }
      }

      while (selectedColors.length < 3) {
        selectedColors.push(sortedByVibrancy[selectedColors.length])
      }

      resolve({
        primary: rgbToHex(
          selectedColors[0].r,
          selectedColors[0].g,
          selectedColors[0].b
        ),
        secondary: rgbToHex(
          selectedColors[1].r,
          selectedColors[1].g,
          selectedColors[1].b
        ),
        accent: rgbToHex(
          selectedColors[2].r,
          selectedColors[2].g,
          selectedColors[2].b
        ),
      })
    }

    img.onerror = () => {
      resolve({
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
      })
    }

    img.src = imageUrl
  })
}
