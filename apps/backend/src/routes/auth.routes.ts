import { Elysia } from 'elysia';
import { jwtPlugin, authMiddleware } from '../middleware/auth';
import { authService } from '../services/auth.service';
import { success } from '../utils/response';
import { RegisterSchema, LoginSchema } from '../utils/validation';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .post(
    '/register',
    async ({ body, jwt }) => {
      const result = await authService.register(body, (payload) =>
        jwt.sign(payload),
      );
      return success(result);
    },
    {
      body: RegisterSchema,
      detail: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description:
          'Create a new user account with username, email, and password',
      },
    },
  )
  .post(
    '/login',
    async ({ body, jwt }) => {
      const result = await authService.login(body, (payload) =>
        jwt.sign(payload),
      );
      return success(result);
    },
    {
      body: LoginSchema,
      detail: {
        tags: ['Auth'],
        summary: 'Login user',
        description: 'Authenticate user and receive JWT token',
      },
    },
  )
  .use(authMiddleware)
  .get(
    '/me',
    async ({ user }) => {
      const currentUser = await authService.getCurrentUser(user.userId);
      return success(currentUser);
    },
    {
      detail: {
        tags: ['Auth'],
        summary: 'Get current user',
        description: 'Get currently authenticated user profile',
      },
    },
  );
