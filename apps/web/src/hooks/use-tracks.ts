import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  uploadTrack,
  getUserTracks,
  getTrackById,
  updateTrack,
  deleteTrack,
  getStreamUrl,
  type Track,
  type TrackWithUser,
  type UploadTrackInput,
  type UpdateTrackInput,
} from '../api/tracks'
import { useCallback, useMemo } from 'react'

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
    mutationFn: (input: UpdateTrackInput) => updateTrack(trackId, input),
    onSuccess: (updatedTrack) => {
      queryClient.setQueryData(TRACK_QUERY_KEY(trackId), updatedTrack)
      queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY })
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
