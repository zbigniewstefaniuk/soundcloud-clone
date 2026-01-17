import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { env } from '../config/env';
import { AuthError } from './error';
import type { JWTPayload } from '../types/auth.types';

export const jwtPlugin = new Elysia().use(
  jwt({
    name: 'jwt',
    secret: env.JWT_SECRET,
    exp: env.JWT_EXPIRES_IN,
  }),
);

export const authMiddleware = (app: any) =>
  app.derive(async ({ headers, jwt }: any) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await jwt.verify(token);

      if (!payload) {
        throw new AuthError('Invalid token');
      }

      return {
        user: payload as JWTPayload,
      };
    } catch (error) {
      throw new AuthError('Invalid or expired token');
    }
  });
