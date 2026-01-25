import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'

export function useUserPublicProfile(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['user-profile', userId] as const,
    queryFn: () => usersApi.getUserById(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useUserPublicTracks(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['user-public-tracks', userId] as const,
    queryFn: () => usersApi.getUserPublicTracks(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    tracks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'] as const,
    queryFn: () => usersApi.getAllUsers(),
  })
}
