import { Elysia, t } from 'elysia';
import { jwtPlugin, authMiddleware } from '../middleware/auth';
import { commentService } from '../services/comment.service';
import { success, paginated } from '../utils/response';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  PaginationSchema,
} from '../utils/validation';

export const commentRoutes = new Elysia()
  .use(jwtPlugin)
  .get(
    '/tracks/:id/comments',
    async ({ params, query }) => {
      const result = await commentService.getTrackComments(
        params.id,
        query.page,
        query.pageSize
      );
      return paginated(result.data, result.pagination);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: PaginationSchema,
      detail: {
        tags: ['Comments'],
        summary: 'Get track comments',
        description: 'Get paginated comments for a track',
      },
    }
  )
  .use(authMiddleware)
  .post(
    '/tracks/:id/comments',
    async ({ params, body, user }) => {
      const comment = await commentService.createComment(
        user.userId,
        params.id,
        body.content,
        body.timestamp ?? undefined
      );
      return success(comment);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: CreateCommentSchema,
      detail: {
        tags: ['Comments'],
        summary: 'Add comment',
        description: 'Add a comment to a track',
      },
    }
  )
  .patch(
    '/comments/:id',
    async ({ params, body, user }) => {
      const updated = await commentService.updateComment(
        params.id,
        user.userId,
        body.content
      );
      return success(updated);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateCommentSchema,
      detail: {
        tags: ['Comments'],
        summary: 'Update comment',
        description: 'Update own comment',
      },
    }
  )
  .delete(
    '/comments/:id',
    async ({ params, user }) => {
      const result = await commentService.deleteComment(params.id, user.userId);
      return success(result);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Comments'],
        summary: 'Delete comment',
        description: 'Delete own comment',
      },
    }
  );
