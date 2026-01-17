import { eq, and, count } from 'drizzle-orm';
import { db } from '../config/database';
import { likes, tracks, users } from '../db/schema';
import { NotFoundError, ConflictError } from '../middleware/error';

export class LikeService {
  async likeTrack(userId: string, trackId: string) {
    const [track] = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, trackId))
      .limit(1);

    if (!track) {
      throw new NotFoundError('Track');
    }

    const [existing] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)))
      .limit(1);

    if (existing) {
      throw new ConflictError('Track already liked');
    }

    const [like] = await db
      .insert(likes)
      .values({
        userId,
        trackId,
      })
      .returning();

    return like;
  }

  async unlikeTrack(userId: string, trackId: string) {
    const result = await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError('Like');
    }

    return { message: 'Track unliked successfully' };
  }

  async getTrackLikes(
    trackId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const offset = (page - 1) * pageSize;

    const [totalResult] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.trackId, trackId));

    if (!totalResult?.count) {
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
        },
      };
    }

    const likesData = await db
      .select({
        like: likes,
        user: {
          id: users.id,
          username: users.username,
        },
      })
      .from(likes)
      .leftJoin(users, eq(likes.userId, users.id))
      .where(eq(likes.trackId, trackId))
      .limit(pageSize)
      .offset(offset);

    return {
      data: likesData,
      pagination: {
        page,
        pageSize,
        total: totalResult.count,
      },
    };
  }

  async getUserLikes(userId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const [totalResult] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.userId, userId));

    const likesData = await db
      .select({
        like: likes,
        track: tracks,
        user: {
          id: users.id,
          username: users.username,
        },
      })
      .from(likes)
      .leftJoin(tracks, eq(likes.trackId, tracks.id))
      .leftJoin(users, eq(tracks.userId, users.id))
      .where(eq(likes.userId, userId))
      .limit(pageSize)
      .offset(offset);

    return {
      data: likesData.map((l) => ({
        ...l.track,
        user: l.user,
        likedAt: l.like.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total: totalResult?.count ?? 0,
      },
    };
  }

  async isLikedByUser(userId: string, trackId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)))
      .limit(1);

    return !!like;
  }
}

export const likeService = new LikeService();
