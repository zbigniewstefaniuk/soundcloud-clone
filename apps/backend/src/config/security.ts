import { env } from './env'
import type { CORSConfig } from '@elysiajs/cors'

const isProduction = env.NODE_ENV === 'production'

export const securityConfig = {
  isProduction,

  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    ...(isProduction && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }),
  },

  cors: {
    origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') || [] : true,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Range',
      'Accept-Ranges',
      'Content-Range',
      'X-Requested-With',
    ],
    exposeHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const,
    maxAge: 86400, // 24 hours
  } satisfies CORSConfig,

  rateLimit: {
    windowMs: 60 * 1000,
    max: isProduction ? 100 : 1000,
  },
} as const
