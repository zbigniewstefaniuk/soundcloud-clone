import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'
import { searchTracks, searchUsers } from '@/api/search'

const TRACK_SEARCH_QUERY_KEY = (query: string) => ['search', 'tracks', query] as const
const USER_SEARCH_QUERY_KEY = (query: string) => ['search', 'users', query] as const

export interface UseTrackSearchOptions {
  debounceMs?: number
  limit?: number
  threshold?: number
  enabled?: boolean
}

export function useTrackSearch(query: string, options: UseTrackSearchOptions = {}) {
  const { debounceMs = 300, limit = 20, threshold = 0.15, enabled = true } = options

  // Simple debounce implementation
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  const trimmedQuery = debouncedQuery.trim()

  const queryResult = useQuery({
    queryKey: TRACK_SEARCH_QUERY_KEY(trimmedQuery),
    queryFn: () => searchTracks({ query: trimmedQuery, limit, threshold }),
    enabled: enabled && trimmedQuery.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
  })

  return useMemo(
    () => ({
      results: queryResult.data ?? [],
      isLoading: queryResult.isLoading && trimmedQuery.length >= 2,
      isFetching: queryResult.isFetching,
      isError: queryResult.isError,
      error: queryResult.error,
      // Indicates if we're waiting for debounce
      isDebouncing: query !== debouncedQuery,
    }),
    [
      queryResult.data,
      queryResult.isLoading,
      queryResult.isFetching,
      queryResult.isError,
      queryResult.error,
      query,
      debouncedQuery,
      trimmedQuery,
    ],
  )
}

export interface UseUserSearchOptions {
  debounceMs?: number
  limit?: number
  enabled?: boolean
}

export function useUserSearch(query: string, options: UseUserSearchOptions = {}) {
  const { debounceMs = 300, limit = 10, enabled = true } = options

  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  const trimmedQuery = debouncedQuery.trim()

  const queryResult = useQuery({
    queryKey: USER_SEARCH_QUERY_KEY(trimmedQuery),
    queryFn: () => searchUsers({ query: trimmedQuery, limit }),
    enabled: enabled && trimmedQuery.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })

  return useMemo(
    () => ({
      results: queryResult.data ?? [],
      isLoading: queryResult.isLoading && trimmedQuery.length >= 2,
      isFetching: queryResult.isFetching,
      isError: queryResult.isError,
      error: queryResult.error,
      isDebouncing: query !== debouncedQuery,
    }),
    [
      queryResult.data,
      queryResult.isLoading,
      queryResult.isFetching,
      queryResult.isError,
      queryResult.error,
      query,
      debouncedQuery,
      trimmedQuery,
    ],
  )
}
