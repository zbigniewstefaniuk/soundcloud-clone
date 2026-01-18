import { X, ListMusic, Play, Pause, Music2 } from 'lucide-react'
import { usePlayer } from '@/contexts/player-context'
import { TrackCover } from '@/components/tracks/track-cover'
import { cn } from '@/lib/utils'
import type { TrackWithUser } from '@/api/tracks'

interface QueueSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function QueueSidebar({ isOpen, onClose }: QueueSidebarProps) {
  const { queue, queueIndex, currentTrack, playTrack, isPlaying, togglePlay } = usePlayer()

  const handleTrackClick = (track: TrackWithUser, index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track, queue)
    }
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 cursor-default"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          aria-label="Close queue"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50 transform transition-transform duration-200 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-primary" />
            <span className="font-semibold">Queue</span>
            {queue.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({queue.length} tracks)
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Close queue"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Music2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No tracks in queue</h3>
              <p className="text-sm text-muted-foreground">
                Play a track to start your queue
              </p>
            </div>
          ) : (
            <div className="p-2">
              {currentTrack && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    Now Playing
                  </p>
                  <QueueItem
                    track={currentTrack}
                    isActive
                    isPlaying={isPlaying}
                    onClick={() => togglePlay()}
                  />
                </div>
              )}

              {queue.length > queueIndex + 1 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    Next Up
                  </p>
                  <div className="space-y-1">
                    {queue.slice(queueIndex + 1).map((track, idx) => (
                      <QueueItem
                        key={`${track.id}-${idx}`}
                        track={track}
                        isActive={false}
                        isPlaying={false}
                        onClick={() => handleTrackClick(track, queueIndex + 1 + idx)}
                        index={idx + 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {queueIndex > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    Previously Played
                  </p>
                  <div className="space-y-1 opacity-60">
                    {queue.slice(0, queueIndex).map((track, idx) => (
                      <QueueItem
                        key={`${track.id}-prev-${idx}`}
                        track={track}
                        isActive={false}
                        isPlaying={false}
                        onClick={() => handleTrackClick(track, idx)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

interface QueueItemProps {
  track: TrackWithUser
  isActive: boolean
  isPlaying: boolean
  onClick: () => void
  index?: number
}

function QueueItem({ track, isActive, isPlaying, onClick, index }: QueueItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left group',
        isActive
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-accent'
      )}
    >
      <div className="relative">
        <TrackCover
          coverArtUrl={track.coverArtUrl}
          title={track.title}
          size="sm"
          className="w-10 h-10"
        />
        <div
          className={cn(
            'absolute inset-0 bg-black/40 flex items-center justify-center rounded-md transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {isActive && isPlaying ? (
            <Pause className="h-4 w-4 text-white" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 text-white ml-0.5" fill="currentColor" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isActive && 'text-primary'
          )}
        >
          {track.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {track.mainArtist || track.user?.username}
        </p>
      </div>

      {index !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums pr-1">
          {index}
        </span>
      )}
    </button>
  )
}
