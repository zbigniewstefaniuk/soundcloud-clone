import { Heart, Headphones } from 'lucide-react'

interface TrackStatsProps {
  playCount: number
  likeCount?: number
  genre?: string | null
}

export function TrackStats({ playCount, likeCount = 0, genre }: TrackStatsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {genre && (
        <span className="inline-block px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">
          {genre}
        </span>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Headphones className="h-3 w-3" />
        <span>{playCount}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Heart className="h-3 w-3" />
        <span>{likeCount}</span>
      </div>
    </div>
  )
}
