import { api } from './client'
import { handleError } from './error'
import type { TrackWithUser } from './tracks'

// Type inference from API responses
export type UserProfile = Awaited<ReturnType<typeof getUserById>>
export type UserPublicTrack = Awaited<ReturnType<typeof getUserPublicTracks>>[number]

export async function getUserById(id: string) {
  const { data: response, error } = await api.users({ id }).get()

  if (error) {
    handleError(error)
  }

  return response!.data
}

export async function getUserPublicTracks(userId: string) {
  const { data: response, error } = await api.users({ id: userId }).tracks.get()

  if (error) {
    handleError(error)
  }

  return response!.data
}
export async function getAllUsers() {
  const { data: response, error } = await api.users.get()

  if (error) {
    handleError(error)
  }

  return response!.data
}

export const usersApi = {
  getUserById,
  getUserPublicTracks,
  getAllUsers,
}

/**
 * Normalize user's public track to TrackWithUser format
 * Required for player context compatibility
 */
export function normalizeUserPublicTrack(
  track: UserPublicTrack,
  owner: { id: string; username: string },
): TrackWithUser {
  return {
    ...track,
    user: owner,
    likeCount: 0,
    collaborators: [],
  } as TrackWithUser
}
