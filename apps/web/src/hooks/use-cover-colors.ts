import { useState, useEffect } from 'react'
import { extractColorsFromImage } from '@/lib/color-extraction'
import { getAssetUrl } from '@/lib/utils'

const DEFAULT_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#ec4899',
}

export function useCoverColors(coverArtUrl?: string | null) {
  const [colors, setColors] = useState(DEFAULT_COLORS)
  const coverUrl = getAssetUrl(coverArtUrl)

  useEffect(() => {
    if (!coverUrl) {
      setColors(DEFAULT_COLORS)
      return
    }
    extractColorsFromImage(coverUrl).then(setColors)
  }, [coverUrl])

  return colors
}
