import { api } from './client'
import { ApiError } from './auth'
import { env } from '@/env'

// Infer types from API responses
export type TrackWithUser = Awaited<ReturnType<typeof getTrackById>>
export type Track = TrackWithUser
export type PublicTracksResponse = Awaited<ReturnType<typeof getPublicTracks>>

function handleError(error: unknown): never {
  if (error && typeof error === 'object' && 'value' in error) {
    const errorValue = (error as { value: { error?: { code: string; message: string } } }).value
    if (errorValue?.error?.code && errorValue?.error?.message) {
      throw new ApiError(errorValue.error.code, errorValue.error.message)
    }
  }
  throw new ApiError('UNKNOWN_ERROR', 'An unexpected error occurred')
}

export interface UploadTrackInput {
  file: File
  coverArt?: File
  title: string
  description?: string
  genre?: string
  mainArtist?: string
  isPublic: boolean
}

export interface UpdateTrackInput {
  title?: string
  description?: string | null
  genre?: string | null
  mainArtist?: string | null
  isPublic?: boolean
  coverArt?: File
}

export async function getPublicTracks(params: {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: 'createdAt' | 'playCount' | 'likeCount'
  order?: 'asc' | 'desc'
} = {}) {
  const { data: response, error } = await api.tracks.get({ query: params })

  if (error) {
    handleError(error)
  }

  return response!
}

export async function getTrackById(id: string) {
  const { data: response, error } = await api.tracks({ id }).get()

  if (error) {
    handleError(error)
  }

  return response.data
}

export async function getUserTracks() {
  const { data: response, error } = await api.users.me.tracks.get()
  
  if (error) {
    handleError(error)
  }

  return response!.data
}

export async function uploadTrack(input: UploadTrackInput) {
  // Eden treaty handles File objects directly - pass them as an object
  const { data, error } = await api.tracks.post({
    file: input.file,
    title: input.title,
    isPublic: String(input.isPublic),
    ...(input.coverArt && { coverArt: input.coverArt }),
    ...(input.description && { description: input.description }),
    ...(input.genre && { genre: input.genre }),
    ...(input.mainArtist && { mainArtist: input.mainArtist }),
  })

  if (error) {
    handleError(error)
  }

  return data?.data
}

export async function updateTrack(id: string, input: UpdateTrackInput) {
  // Eden treaty handles File objects directly - pass them as an object
  const { data: response, error } = await api.tracks({ id }).patch({
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description || '' }),
    ...(input.genre !== undefined && { genre: input.genre || '' }),
    ...(input.mainArtist !== undefined && { mainArtist: input.mainArtist || '' }),
    ...(input.isPublic !== undefined && { isPublic: String(input.isPublic) }),
    ...(input.coverArt && { coverArt: input.coverArt }),
  })

  if (error) {
    handleError(error)
  }

  return response!.data
}

export async function deleteTrack(id: string) {
  const { error } = await api.tracks({ id }).delete()

  if (error) {
    handleError(error)
  }
}



export function getStreamUrl(id: string): string {
  return `${env.VITE_API_URL}/tracks/${id}/stream`
}

export async function likeTrack(trackId: string) {
  const { data, error } = await api.tracks({ id: trackId }).like.post()
  if (error) handleError(error)
  return data
}

export async function unlikeTrack(trackId: string) {
  const { data, error } = await api.tracks({ id: trackId }).like.delete()
  if (error) handleError(error)
  return data
}

export async function batchCheckLikes(trackIds: string[]): Promise<Record<string, boolean>> {
  if (trackIds.length === 0) return {}
  // Using fetch directly as this is a new endpoint - Eden types need regeneration
  const response = await fetch(`${env.VITE_API_URL}/tracks/likes/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(await import('@/lib/auth-storage').then(m => m.authStorage.getHeaders()))
      ),
    },
    body: JSON.stringify({ trackIds }),
  })
  if (!response.ok) {
    throw new ApiError('BATCH_CHECK_FAILED', 'Failed to check likes')
  }
  const result = await response.json()
  return result.data ?? {}
}

export async function getUserLikedTracks(params: { page?: number; pageSize?: number } = {}) {
  const { data: response, error } = await api.users.me.likes.get({ query: params })

  if (error) {
    handleError(error)
  }

  return response!
} 