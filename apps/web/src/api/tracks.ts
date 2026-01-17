import { apiClient } from './client'
import { authStorage } from '../lib/auth-storage'
import { env } from '@/env';

export interface Track {
  id: string
  userId: string
  title: string
  description?: string | null
  genre?: string | null
  mainArtist?: string | null
  audioUrl: string
  coverArtUrl?: string | null
  duration?: number | null
  fileSize: number
  mimeType: string
  playCount: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface TrackWithUser extends Track {
  user: {
    id: string
    username: string
  }
  likeCount?: number
  isLiked?: boolean
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

export interface ApiError {
  code: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

export class TrackError extends Error {
  code: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'TrackError'
    this.code = error.code
  }
}

const apiUrl = env.VITE_API_URL || 'http://localhost:8000'


export async function uploadTrack(input: UploadTrackInput): Promise<Track> {
  const formData = new FormData()
  formData.append('file', input.file)

  if (input.coverArt) {
    formData.append('coverArt', input.coverArt)
  }

  formData.append('title', input.title)

  if (input.description) {
    formData.append('description', input.description)
  }

  if (input.genre) {
    formData.append('genre', input.genre)
  }

  if (input.mainArtist) {
    formData.append('mainArtist', input.mainArtist)
  }

  formData.append('isPublic', String(input.isPublic))

  const token = authStorage.token.get()

  const response = await fetch(`${apiUrl}/tracks/`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!response.ok) {
    try {
      const errorData = await response.json()
      if (errorData?.error?.code && errorData?.error?.message) {
        throw new TrackError(errorData.error)
      }
    } catch (e) {
      if (e instanceof TrackError) throw e
    }
    throw new TrackError({ code: 'UPLOAD_FAILED', message: 'Upload failed' })
  }

  const result = await response.json()
  return result.data as Track
}

export async function updateTrack(
  id: string,
  input: UpdateTrackInput
): Promise<Track> {
  if (input.coverArt) {
    const formData = new FormData()

    if (input.title !== undefined) formData.append('title', input.title)
    if (input.description !== undefined)
      formData.append('description', input.description || '')
    if (input.genre !== undefined) formData.append('genre', input.genre || '')
    if (input.mainArtist !== undefined)
      formData.append('mainArtist', input.mainArtist || '')
    if (input.isPublic !== undefined)
      formData.append('isPublic', String(input.isPublic))
    formData.append('coverArt', input.coverArt)

    const token = authStorage.token.get()

    const response = await fetch(`${apiUrl}/tracks/${id}`, {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        if (errorData?.error?.code && errorData?.error?.message) {
          throw new TrackError(errorData.error)
        }
      } catch (e) {
        if (e instanceof TrackError) throw e
      }
      throw new TrackError({
        code: 'UPDATE_FAILED',
        message: 'Update failed',
      })
    }

    const result = await response.json()
    return result.data as Track
  }

  const { data: response, error } = await apiClient.PATCH('/tracks/{id}', {
    params: { path: { id } },
    body: input as any,
  })

  if (error) {
    const errorData = error as unknown as ApiErrorResponse
    if (errorData?.error?.code && errorData?.error?.message) {
      throw new TrackError(errorData.error)
    }
    throw new TrackError({ code: 'UPDATE_FAILED', message: 'Update failed' })
  }

  if (!response) {
    throw new TrackError({ code: 'UPDATE_FAILED', message: 'Update failed' })
  }

  return (response as any).data as Track
}

export async function getUserTracks(): Promise<TrackWithUser[]> {
  const { data: response, error } = await apiClient.GET('/users/me/tracks')

  if (error) {
    const errorData = error as unknown as ApiErrorResponse
    if (errorData?.error?.code && errorData?.error?.message) {
      throw new TrackError(errorData.error)
    }
    throw new TrackError({
      code: 'FETCH_FAILED',
      message: 'Failed to fetch tracks',
    })
  }

  if (!response) {
    throw new TrackError({
      code: 'FETCH_FAILED',
      message: 'Failed to fetch tracks',
    })
  }

  return (response as any).data as TrackWithUser[]
}

export async function getTrackById(id: string): Promise<TrackWithUser> {
  const { data: response, error } = await apiClient.GET('/tracks/{id}', {
    params: { path: { id } },
  })

  if (error) {
    const errorData = error as unknown as ApiErrorResponse
    if (errorData?.error?.code && errorData?.error?.message) {
      throw new TrackError(errorData.error)
    }
    throw new TrackError({
      code: 'FETCH_FAILED',
      message: 'Failed to fetch track',
    })
  }

  if (!response) {
    throw new TrackError({
      code: 'FETCH_FAILED',
      message: 'Failed to fetch track',
    })
  }

  return (response as any).data as TrackWithUser
}

export async function deleteTrack(id: string): Promise<void> {
  const { error } = await apiClient.DELETE('/tracks/{id}', {
    params: { path: { id } },
  })

  if (error) {
    const errorData = error as unknown as ApiErrorResponse
    if (errorData?.error?.code && errorData?.error?.message) {
      throw new TrackError(errorData.error)
    }
    throw new TrackError({
      code: 'DELETE_FAILED',
      message: 'Failed to delete track',
    })
  }
}

export function getStreamUrl(id: string): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return `${apiUrl}/tracks/${id}/stream`
}
