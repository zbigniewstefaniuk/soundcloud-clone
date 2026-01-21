import { useState } from 'react'
import { Music } from 'lucide-react'
import { cn, getAssetUrl } from '@/lib/utils'

interface TrackCoverProps {
  coverArtUrl?: string | null
  title: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  full: 'w-full h-full',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  full: 'h-16 w-16',
}

export function TrackCover({ coverArtUrl, title, size = 'md', className }: TrackCoverProps) {
  const coverUrl = getAssetUrl(coverArtUrl)
  const [isLoaded, setIsLoaded] = useState(false)

  if (coverUrl) {
    return (
      <div
        className={cn('relative overflow-hidden rounded bg-muted', sizeClasses[size], className)}
      >
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
          )}
        />
        {!isLoaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded bg-muted flex items-center justify-center',
        sizeClasses[size],
        className,
      )}
    >
      <Music className={cn('text-muted-foreground', iconSizes[size])} />
    </div>
  )
}
