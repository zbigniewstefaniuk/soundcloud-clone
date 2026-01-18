import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  uploadTrack,
  getUserTracks,
  getTrackById,
  updateTrack,
  deleteTrack,
  getPublicTracks,
  likeTrack,
  unlikeTrack,
  batchCheckLikes,
  type UploadTrackInput,
  type UpdateTrackInput,
} from '@/api/tracks'
import { getStreamUrl } from '@/api/client'
import { useMemo } from 'react'
import { toast } from 'sonner';

const TRACKS_QUERY_KEY = ['user-tracks'] as const
const TRACK_QUERY_KEY = (id: string) => ['track', id] as const

export function useUploadTrack() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (input: UploadTrackInput) => uploadTrack(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY })
      navigate({ to: '/profile/tracks' })
      toast.success('Track uploaded successfully')
    },
  })
}

export function useUserTracks() {
  const query = useQuery({
    queryKey: TRACKS_QUERY_KEY,
    queryFn: getUserTracks,
    staleTime: 1000 * 60 * 5,
  })

  return useMemo(
    () => ({
      tracks: query.data ?? [],
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isError, query.error, query.refetch]
  )
}

export function useTrack(id: string | undefined) {
  const query = useQuery({
    queryKey: TRACK_QUERY_KEY(id!),
    queryFn: () => getTrackById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  return useMemo(
    () => ({
      track: query.data ?? null,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isError, query.error, query.refetch]
  )
}

export function useUpdateTrack(trackId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: TRACK_QUERY_KEY(trackId),
    mutationFn: (input: UpdateTrackInput) => updateTrack(trackId, input),
    onSuccess: (updatedTrack) => {
      queryClient.setQueryData(TRACK_QUERY_KEY(trackId), updatedTrack)
      queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY })
      toast.success('Track updated successfully')
    },
  })
}

export function useDeleteTrack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (trackId: string) => deleteTrack(trackId),
    onSuccess: (_, trackId) => {
      queryClient.removeQueries({ queryKey: TRACK_QUERY_KEY(trackId) })
      queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY })
    },
  })
}

export function useStreamUrl(trackId: string | undefined): string | null {
  return trackId ? getStreamUrl(trackId) : null
}

export interface GetTracksParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: 'createdAt' | 'playCount' | 'likeCount'
  order?: 'asc' | 'desc'
}

const PUBLIC_TRACKS_QUERY_KEY = (params: GetTracksParams) =>
  ['public-tracks', params] as const

export function usePublicTracks(params: GetTracksParams = {}) {
  const query = useQuery({
    queryKey: PUBLIC_TRACKS_QUERY_KEY(params),
    queryFn: () => getPublicTracks(params),
    staleTime: 1000 * 60 * 2,
  })

  return useMemo(
    () => ({
      tracks: query.data?.data ?? [],
      pagination: query.data?.pagination ?? null,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isError, query.error, query.refetch]
  )
}

const BATCH_LIKES_QUERY_KEY = (trackIds: string[]) =>
  ['batch-likes', trackIds.sort().join(',')] as const

export function useBatchLikeStatus(trackIds: string[], enabled = true) {
  const query = useQuery({
    queryKey: BATCH_LIKES_QUERY_KEY(trackIds),
    queryFn: () => batchCheckLikes(trackIds),
    enabled: enabled && trackIds.length > 0,
    staleTime: 1000 * 60 * 2,
  })

  return useMemo(
    () => ({
      likedMap: query.data ?? {},
      isLoading: query.isLoading,
      isError: query.isError,
    }),
    [query.data, query.isLoading, query.isError]
  )
}

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      return isLiked ? unlikeTrack(trackId) : likeTrack(trackId)
    },
    onMutate: async ({ trackId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['batch-likes'] })
      await queryClient.cancelQueries({ queryKey: ['public-tracks'] })

      // Snapshot previous values for rollback
      const previousBatchLikes = queryClient.getQueriesData({ queryKey: ['batch-likes'] })
      const previousPublicTracks = queryClient.getQueriesData({ queryKey: ['public-tracks'] })

      // Optimistically update batch likes cache
      queryClient.setQueriesData<Record<string, boolean>>(
        { queryKey: ['batch-likes'] },
        (old) => {
          if (!old) return old
          return { ...old, [trackId]: !isLiked }
        }
      )

      // Optimistically update like counts in track queries
      queryClient.setQueriesData<{ data: Array<{ id: string; likeCount: number }>; pagination: unknown }>(
        { queryKey: ['public-tracks'] },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((track) =>
              track.id === trackId
                ? { ...track, likeCount: track.likeCount + (isLiked ? -1 : 1) }
                : track
            ),
          }
        }
      )

      return { previousBatchLikes, previousPublicTracks }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousBatchLikes) {
        context.previousBatchLikes.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
      if (context?.previousPublicTracks) {
        context.previousPublicTracks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
      toast.error('Failed to update like')
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['batch-likes'] })
      queryClient.invalidateQueries({ queryKey: ['public-tracks'] })
    },
  })
}
