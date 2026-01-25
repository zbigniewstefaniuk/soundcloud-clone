import { api } from './client'
import { handleError } from './error'

export type SearchResult = NonNullable<
  Awaited<ReturnType<typeof api.search.tracks.get>>['data']
>['data'][number]

export type UserSearchResult = NonNullable<
  Awaited<ReturnType<typeof api.search.users.get>>['data']
>['data'][number]

export interface SearchTracksParams {
  query: string
  limit?: number
  threshold?: number
}

export interface SearchUsersParams {
  query: string
  limit?: number
}

export async function searchTracks(params: SearchTracksParams) {
  const { data: response, error } = await api.search.tracks.get({
    query: {
      q: params.query,
      limit: params.limit,
      threshold: params.threshold,
    },
  })

  if (error) {
    handleError(error)
  }

  return response!.data
}

export async function searchUsers(params: SearchUsersParams) {
  const { data: response, error } = await api.search.users.get({
    query: {
      q: params.query,
      limit: params.limit,
    },
  })

  if (error) {
    handleError(error)
  }

  return response!.data
}
