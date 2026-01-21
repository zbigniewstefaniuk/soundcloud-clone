import { eq, count, desc } from 'drizzle-orm'
import { db } from '../config/database'
import { comments, tracks, users } from '../db/schema'
import { NotFoundError, ForbiddenError } from '../middleware/error'

export class CommentService {
  async createComment(userId: string, trackId: string, content: string, timestamp?: number) {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, trackId)).limit(1)

    if (!track) {
      throw new NotFoundError('Track')
    }

    const [comment] = await db
      .insert(comments)
      .values({
        userId,
        trackId,
        content,
        timestamp,
      })
      .returning()

    if (!comment) {
      throw new NotFoundError('Comment')
    }

    const [commentWithUser] = await db
      .select({
        comment: comments,
        user: {
          id: users.id,
          username: users.username,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, comment.id))
      .limit(1)

    return commentWithUser
  }

  async getTrackComments(trackId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize

    const [totalResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.trackId, trackId))

    if (!totalResult?.count) {
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
        },
      }
    }

    const commentsData = await db
      .select({
        comment: comments,
        user: {
          id: users.id,
          username: users.username,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.trackId, trackId))
      .orderBy(desc(comments.createdAt))
      .limit(pageSize)
      .offset(offset)

    return {
      data: commentsData.map((c) => ({
        ...c.comment,
        user: c.user,
      })),
      pagination: {
        page,
        pageSize,
        total: totalResult.count,
      },
    }
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1)

    if (!comment) {
      throw new NotFoundError('Comment')
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only update your own comments')
    }

    const [updated] = await db
      .update(comments)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning()

    return updated
  }

  async deleteComment(commentId: string, userId: string) {
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1)

    if (!comment) {
      throw new NotFoundError('Comment')
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only delete your own comments')
    }

    await db.delete(comments).where(eq(comments.id, commentId))

    return { message: 'Comment deleted successfully' }
  }
}

export const commentService = new CommentService()
