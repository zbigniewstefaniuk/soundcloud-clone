import { useAccount } from '@/hooks/use-auth'
import { useBatchLikeStatus, useToggleLike } from '@/hooks/use-tracks'

export function useTrackLike(trackId: string | undefined) {
  const { user } = useAccount()
  const trackIds = trackId ? [trackId] : []
  const { likedMap } = useBatchLikeStatus(trackIds, !!user)
  const toggleLikeMutation = useToggleLike()

  const isLiked = trackId ? (likedMap[trackId] ?? false) : false

  const toggleLike = () => {
    if (!user || !trackId) return
    toggleLikeMutation.mutate({ trackId, isLiked })
  }

  return {
    isLiked,
    toggleLike,
    canLike: !!user,
    isLoading: toggleLikeMutation.isPending,
  }
}
