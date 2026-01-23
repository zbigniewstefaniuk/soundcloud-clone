import { api } from './client'
import { handleError } from './error'

export type SearchResult = NonNullable<
  Awaited<ReturnType<typeof api.search.tracks.get>>['data']
>['data'][number]

export interface SearchTracksParams {
  query: string
  limit?: number
  threshold?: number
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
