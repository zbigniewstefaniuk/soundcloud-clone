import { eq, and, count, inArray } from 'drizzle-orm'
import { db } from '../config/database'
import { likes, tracks, users } from '../db/schema'
import { userProjection } from '../db/projections'
import { NotFoundError, ConflictError } from '../middleware/error'
import { emptyPaginatedResult, paginatedResult, type PaginatedResult } from '../utils/pagination'
import { findTrackByIdOrThrow } from '../utils/entity'

type UserProjection = { id: string; username: string }
type LikeWithUser = { like: typeof likes.$inferSelect; user: UserProjection | null }
type LikedTrackItem = Partial<typeof tracks.$inferSelect> & { user: UserProjection | null; likedAt: Date }

export class LikeService {
  async likeTrack(userId: string, trackId: string) {
    await findTrackByIdOrThrow(trackId)

    const [existing] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)))
      .limit(1)

    if (existing) {
      throw new ConflictError('Track already liked')
    }

    const [like] = await db
      .insert(likes)
      .values({
        userId,
        trackId,
      })
      .returning()

    return like
  }

  async unlikeTrack(userId: string, trackId: string) {
    const result = await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)))
      .returning()

    if (result.length === 0) {
      throw new NotFoundError('Like')
    }

    return { message: 'Track unliked successfully' }
  }

  async getTrackLikes(
    trackId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<LikeWithUser>> {
    const offset = (page - 1) * pageSize

    const [totalResult] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.trackId, trackId))

    if (!totalResult?.count) {
      return emptyPaginatedResult(page, pageSize)
    }

    const likesData = await db
      .select({
        like: likes,
        user: userProjection,
      })
      .from(likes)
      .leftJoin(users, eq(likes.userId, users.id))
      .where(eq(likes.trackId, trackId))
      .limit(pageSize)
      .offset(offset)

    return paginatedResult(likesData, totalResult.count, page, pageSize)
  }

  async getUserLikes(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<LikedTrackItem>> {
    const offset = (page - 1) * pageSize

    const [totalResult] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.userId, userId))

    const likesData = await db
      .select({
        like: likes,
        track: tracks,
        user: userProjection,
      })
      .from(likes)
      .leftJoin(tracks, eq(likes.trackId, tracks.id))
      .leftJoin(users, eq(tracks.userId, users.id))
      .where(eq(likes.userId, userId))
      .limit(pageSize)
      .offset(offset)

    return paginatedResult(
      likesData.map((l) => ({
        ...l.track,
        user: l.user,
        likedAt: l.like.createdAt,
      })),
      totalResult?.count ?? 0,
      page,
      pageSize,
    )
  }

  async isLikedByUser(userId: string, trackId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)))
      .limit(1)

    return !!like
  }

  async batchCheckLikes(userId: string, trackIds: string[]): Promise<Record<string, boolean>> {
    if (trackIds.length === 0) return {}

    const likedTracks = await db
      .select({ trackId: likes.trackId })
      .from(likes)
      .where(and(eq(likes.userId, userId), inArray(likes.trackId, trackIds)))

    const likedSet = new Set(likedTracks.map((l) => l.trackId))
    return Object.fromEntries(trackIds.map((id) => [id, likedSet.has(id)]))
  }
}

export const likeService = new LikeService()
