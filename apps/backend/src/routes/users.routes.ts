import { Elysia, t } from 'elysia';
import { jwtPlugin, authMiddleware } from '../middleware/auth';
import { userService } from '../services/user.service';
import { success } from '../utils/response';
import { UpdateProfileSchema } from '../utils/validation';

export const userRoutes = new Elysia({ prefix: '/users' })
  .use(jwtPlugin)
  .get(
    '/:id',
    async ({ params }) => {
      const user = await userService.getUserProfile(params.id);
      return success(user);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Users'],
        summary: 'Get user profile',
        description: 'Get public user profile by ID',
      },
    }
  )
  .get(
    '/:id/tracks',
    async ({ params }) => {
      const userTracks = await userService.getUserTracks(params.id, false);
      return success(userTracks);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Users'],
        summary: 'Get user tracks',
        description: 'Get public tracks for a user',
      },
    }
  )
  .use(authMiddleware)
  .get(
    '/me',
    async ({ user }) => {
      const currentUser = await userService.getUserProfile(user.userId);
      return success(currentUser);
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Get own profile',
        description: 'Get authenticated user profile',
      },
    }
  )
  .patch(
    '/me',
    async ({ user, body }) => {
      const updated = await userService.updateProfile(user.userId, body);
      return success(updated);
    },
    {
      body: UpdateProfileSchema,
      detail: {
        tags: ['Users'],
        summary: 'Update own profile',
        description: 'Update authenticated user profile',
      },
    }
  )
  .get(
    '/me/tracks',
    async ({ user }) => {
      const userTracks = await userService.getUserTracks(user.userId, true);
      return success(userTracks);
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Get own tracks',
        description: 'Get all tracks including private for authenticated user',
      },
    }
  );
