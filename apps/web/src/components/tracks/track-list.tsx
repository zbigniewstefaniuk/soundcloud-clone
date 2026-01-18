import { useDeleteTrack } from '@/hooks/use-tracks'
import { Button } from '@/components/ui/button'
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
import { Music, Trash2, Edit, Play, Heart, Headphones } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { TrackWithUser } from '@/api/tracks'
import { getAssetUrl } from '@/lib/utils';

interface TrackListProps {
  tracks: TrackWithUser[]
  isOwner?: boolean
  onPlay?: (track: TrackWithUser) => void
}

export function TrackList({ tracks, isOwner = false, onPlay }: TrackListProps) {
  const deleteMutation = useDeleteTrack()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (trackId: string) => {
    setDeletingId(trackId)
    await deleteMutation.mutateAsync(trackId)
    setDeletingId(null)
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tracks</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isOwner
            ? 'Upload your first track to get started.'
            : 'No tracks available.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => {
        const coverUrl = getAssetUrl(track?.coverArtUrl)
        return (
          <div
            key={track.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4 flex-1">
              {track.coverArtUrl ? (
                <img
                  src={coverUrl}
                  alt={track.title}
                  className="w-16 h-16 rounded object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
                  <Music className="h-8 w-8 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {track.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {track.mainArtist || 'Unknown Artist'}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  {track.genre && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                      {track.genre}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Headphones className="h-3 w-3" />
                    <span>{track.playCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Heart className="h-3 w-3" />
                    <span>{track.likeCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onPlay && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPlay(track)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}

                {isOwner && (
                  <>
                    <Link
                      to="/tracks/$trackId/edit"
                      params={{ trackId: track.id }}
                    >
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === track.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Track</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{track.title}"? This
                            action cannot be undone. The audio file and all
                            associated data will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(track.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingId === track.id ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
