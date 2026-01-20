import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { env } from '../config/env';
import { AuthError } from './error';
import type { JWTPayload } from '../types/auth.types';

export const jwtPlugin = new Elysia({ name: 'jwt-plugin' }).use(
  jwt({
    name: 'jwt',
    secret: env.JWT_SECRET,
    exp: env.JWT_EXPIRES_IN,
  })
);

export const optionalAuthMiddleware = new Elysia({ name: 'optional-auth-middleware' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ headers, jwt }) => {
    const authHeader = headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return { currentUserId: undefined };
    }

    try {
      const token = authHeader.substring(7);
      const payload = await jwt.verify(token);

      if (payload && typeof payload === 'object' && 'userId' in payload) {
        return { currentUserId: payload.userId as string };
      }
    } catch {
      // Invalid token - treat as unauthenticated
    }

    return { currentUserId: undefined };
  });

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ headers, jwt }) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.substring(7);

    const payload = await jwt.verify(token);

    if (!payload) {
      throw new AuthError('Invalid or expired token');
    }

    return {
      user: payload as unknown as JWTPayload,
    };
  });
