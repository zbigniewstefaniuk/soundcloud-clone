import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Music, Trash2, Edit, Play, Pause, Heart } from 'lucide-react'
import { useDeleteTrack, useBatchLikeStatus, useToggleLike } from '@/hooks/use-tracks'
import { useAccount } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { TrackCover } from './track-cover'
import { TrackStats } from './track-stats'
import type { TrackWithUser } from '@/api/tracks'

interface TrackListProps {
  tracks: TrackWithUser[]
  isOwner?: boolean
  onTogglePlay?: (track: TrackWithUser) => void
  currentPlayingTrackId?: string | null
}

export function TrackList({
  tracks,
  isOwner = false,
  onTogglePlay,
  currentPlayingTrackId,
}: TrackListProps) {
  const { user } = useAccount()
  const deleteMutation = useDeleteTrack()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const trackIds = tracks.map((t) => t.id)
  const { likedMap } = useBatchLikeStatus(trackIds, !!user)
  const toggleLikeMutation = useToggleLike()

  const handleDelete = async (trackId: string) => {
    setDeletingId(trackId)
    await deleteMutation.mutateAsync(trackId)
    setDeletingId(null)
  }

  const handleToggleLike = (trackId: string) => {
    if (!user) return
    const isLiked = likedMap[trackId] ?? false
    toggleLikeMutation.mutate({ trackId, isLiked })
  }

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No tracks"
        description={
          isOwner
            ? 'Upload your first track to get started.'
            : 'No tracks available.'
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {tracks.map((track) => (
        <TrackListItem
          key={track.id}
          track={track}
          isOwner={isOwner}
          isPlaying={track.id === currentPlayingTrackId}
          isDeleting={deletingId === track.id}
          isLiked={likedMap[track.id] ?? false}
          isLoggedIn={!!user}
          onTogglePlay={onTogglePlay}
          onDelete={handleDelete}
          onToggleLike={handleToggleLike}
        />
      ))}
    </div>
  )
}

interface TrackListItemProps {
  track: TrackWithUser
  isOwner: boolean
  isPlaying: boolean
  isDeleting: boolean
  isLiked: boolean
  isLoggedIn: boolean
  onTogglePlay?: (track: TrackWithUser) => void
  onDelete: (trackId: string) => void
  onToggleLike: (trackId: string) => void
}

function TrackListItem({
  track,
  isOwner,
  isPlaying,
  isDeleting,
  isLiked,
  isLoggedIn,
  onTogglePlay,
  onDelete,
  onToggleLike,
}: TrackListItemProps) {
  return (
    <div className="flex items-center gap-4 p-2 bg-card rounded-lg hover:bg-accent/50 transition-colors">
      <TrackCover coverArtUrl={track.coverArtUrl} title={track.title} size='lg' />

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-foreground truncate">
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {track.mainArtist || 'Unknown Artist'}
        </p>
        <div className="mt-1.5">
          <TrackStats
            playCount={track.playCount}
            likeCount={track.likeCount}
            genre={track.genre}
          />
        </div>
      </div>

      <TrackActions
        track={track}
        isOwner={isOwner}
        isPlaying={isPlaying}
        isDeleting={isDeleting}
        isLiked={isLiked}
        isLoggedIn={isLoggedIn}
        onTogglePlay={onTogglePlay}
        onDelete={onDelete}
        onToggleLike={onToggleLike}
      />
    </div>
  )
}

interface TrackActionsProps {
  track: TrackWithUser
  isOwner: boolean
  isPlaying: boolean
  isDeleting: boolean
  isLiked: boolean
  isLoggedIn: boolean
  onTogglePlay?: (track: TrackWithUser) => void
  onDelete: (trackId: string) => void
  onToggleLike: (trackId: string) => void
}

function TrackActions({
  track,
  isOwner,
  isPlaying,
  isDeleting,
  isLiked,
  isLoggedIn,
  onTogglePlay,
  onDelete,
  onToggleLike,
}: TrackActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onTogglePlay && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTogglePlay(track)}
          type="button"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      )}

      {isLoggedIn && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleLike(track.id)}
          className={cn(
            'transition-colors',
            isLiked && 'text-red-500 hover:text-red-600'
          )}
        >
          <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
        </Button>
      )}

      {isOwner && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/tracks/$trackId/edit" params={{ trackId: track.id }}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>

          <DeleteTrackDialog
            trackTitle={track.title}
            isDeleting={isDeleting}
            onConfirm={() => onDelete(track.id)}
          />
        </>
      )}
    </div>
  )
}

interface DeleteTrackDialogProps {
  trackTitle: string
  isDeleting: boolean
  onConfirm: () => void
}

function DeleteTrackDialog({ trackTitle, isDeleting, onConfirm }: DeleteTrackDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Track</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{trackTitle}"? This action cannot
            be undone. The audio file and all associated data will be
            permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
