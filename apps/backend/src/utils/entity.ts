import { eq, type SQL } from 'drizzle-orm'
import { db } from '../config/database'
import { users, userProfiles, tracks, likes, comments } from '../db/schema'
import { NotFoundError, ForbiddenError } from '../middleware/error'

/** Inferred entity types from schema */
export type User = typeof users.$inferSelect
export type UserProfile = typeof userProfiles.$inferSelect
export type Track = typeof tracks.$inferSelect
export type Like = typeof likes.$inferSelect
export type Comment = typeof comments.$inferSelect

/** Allowed actions for ownership-protected operations */
export type OwnershipAction = 'update' | 'delete' | 'modify' | 'access'

/** Entity with userId for ownership checks */
type OwnedEntity = { userId: string }

async function findOneOrThrow<T>(query: Promise<T[]>, resourceName: string): Promise<T> {
  const [result] = await query
  if (!result) {
    throw new NotFoundError(resourceName)
  }
  return result
}

export function requireOwnership<T extends OwnedEntity>(
  entity: T,
  userId: string,
  action: OwnershipAction,
  resourceName: string,
): asserts entity is T & { userId: typeof userId } {
  if (entity.userId !== userId) {
    throw new ForbiddenError(`You can only ${action} your own ${resourceName}`)
  }
}

export function findUserOrThrow(condition: SQL): Promise<User> {
  return findOneOrThrow(db.select().from(users).where(condition).limit(1), 'User')
}

export function findUserByIdOrThrow(id: string): Promise<User> {
  return findUserOrThrow(eq(users.id, id))
}

export function findUserProfileOrThrow(condition: SQL): Promise<UserProfile> {
  return findOneOrThrow(db.select().from(userProfiles).where(condition).limit(1), 'User profile')
}

export function findUserProfileByIdOrThrow(id: string): Promise<UserProfile> {
  return findUserProfileOrThrow(eq(userProfiles.id, id))
}

export function findUserProfileByUserIdOrThrow(userId: string): Promise<UserProfile> {
  return findUserProfileOrThrow(eq(userProfiles.userId, userId))
}

export function findTrackOrThrow(condition: SQL): Promise<Track> {
  return findOneOrThrow(db.select().from(tracks).where(condition).limit(1), 'Track')
}

export function findTrackByIdOrThrow(id: string): Promise<Track> {
  return findTrackOrThrow(eq(tracks.id, id))
}

export async function findOwnedTrackOrThrow(
  id: string,
  userId: string,
  action: OwnershipAction,
): Promise<Track> {
  const track = await findTrackByIdOrThrow(id)
  requireOwnership(track, userId, action, 'track')
  return track
}

export function findLikeOrThrow(condition: SQL): Promise<Like> {
  return findOneOrThrow(db.select().from(likes).where(condition).limit(1), 'Like')
}

export function findLikeByIdOrThrow(id: string): Promise<Like> {
  return findLikeOrThrow(eq(likes.id, id))
}

export function findCommentOrThrow(condition: SQL): Promise<Comment> {
  return findOneOrThrow(db.select().from(comments).where(condition).limit(1), 'Comment')
}

export function findCommentByIdOrThrow(id: string): Promise<Comment> {
  return findCommentOrThrow(eq(comments.id, id))
}

export async function findOwnedCommentOrThrow(
  id: string,
  userId: string,
  action: OwnershipAction,
): Promise<Comment> {
  const comment = await findCommentByIdOrThrow(id)
  requireOwnership(comment, userId, action, 'comment')
  return comment
}
