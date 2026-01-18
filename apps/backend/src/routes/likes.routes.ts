import { Elysia, t } from 'elysia';
import { jwtPlugin, authMiddleware } from '../middleware/auth';
import { likeService } from '../services/like.service';
import { success, paginated } from '../utils/response';
import { PaginationSchema } from '../utils/validation';

export const likeRoutes = new Elysia()
  .use(jwtPlugin)
  .use(authMiddleware)
  .post(
    '/tracks/:id/like',
    async ({ params, user }) => {
      const like = await likeService.likeTrack(user.userId, params.id);
      return success(like);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Likes'],
        summary: 'Like track',
        description: 'Add track to favorites',
      },
    }
  )
  .delete(
    '/tracks/:id/like',
    async ({ params, user }) => {
      const result = await likeService.unlikeTrack(user.userId, params.id);
      return success(result);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Likes'],
        summary: 'Unlike track',
        description: 'Remove track from favorites',
      },
    }
  )
  .get(
    '/tracks/:id/likes',
    async ({ params, query }) => {
      const result = await likeService.getTrackLikes(
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
        tags: ['Likes'],
        summary: 'Get track likes',
        description: 'Get list of users who liked the track',
      },
    }
  )
  .get(
    '/users/me/likes',
    async ({ user, query }) => {
      const result = await likeService.getUserLikes(
        user.userId,
        query.page,
        query.pageSize
      );
      return paginated(result.data, result.pagination);
    },
    {
      query: PaginationSchema,
      detail: {
        tags: ['Likes'],
        summary: 'Get user likes',
        description: 'Get authenticated user liked tracks',
      },
    }
  )
  .post(
    '/tracks/likes/check',
    async ({ body, user }) => {
      const likedMap = await likeService.batchCheckLikes(user.userId, body.trackIds);
      return success(likedMap);
    },
    {
      body: t.Object({
        trackIds: t.Array(t.String()),
      }),
      detail: {
        tags: ['Likes'],
        summary: 'Batch check liked tracks',
        description: 'Check if multiple tracks are liked by the current user',
      },
    }
  );
