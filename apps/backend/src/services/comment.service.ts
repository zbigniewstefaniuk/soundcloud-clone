import { eq, count, desc } from 'drizzle-orm'
import { db } from '../config/database'
import { comments, users } from '../db/schema'
import { userProjection } from '../db/projections'
import { NotFoundError } from '../middleware/error'
import { paginatedResult, type PaginatedResult } from '../utils/pagination'
import { findTrackByIdOrThrow, findOwnedCommentOrThrow } from '../utils/entity'

type UserProjection = { id: string; username: string }
type CommentWithUser = typeof comments.$inferSelect & { user: UserProjection | null }

export class CommentService {
  async createComment(userId: string, trackId: string, content: string, timestamp?: number) {
    await findTrackByIdOrThrow(trackId)

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
        user: userProjection,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, comment.id))
      .limit(1)

    return commentWithUser
  }

  async getTrackComments(
    trackId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<CommentWithUser>> {
    const offset = (page - 1) * pageSize

    const [totalResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.trackId, trackId))

    const commentsData = await db
      .select({
        comment: comments,
        user: userProjection,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.trackId, trackId))
      .orderBy(desc(comments.createdAt))
      .limit(pageSize)
      .offset(offset)

    return paginatedResult(
      commentsData.map((c) => ({
        ...c.comment,
        user: c.user,
      })),
      totalResult?.count ?? 0,
      page,
      pageSize,
    )
  }

  async updateComment(commentId: string, userId: string, content: string) {
    await findOwnedCommentOrThrow(commentId, userId, 'update')

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
    await findOwnedCommentOrThrow(commentId, userId, 'delete')

    await db.delete(comments).where(eq(comments.id, commentId))

    return { message: 'Comment deleted successfully' }
  }
}

export const commentService = new CommentService()
