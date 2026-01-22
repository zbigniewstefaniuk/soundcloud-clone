import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { securityConfig } from '../config/security'

export const securityHeaders = new Elysia({ name: 'security-headers' }).onAfterHandle(({ set }) => {
  for (const [key, value] of Object.entries(securityConfig.headers)) {
    set.headers[key] = value
  }
})

export const corsMiddleware = new Elysia({ name: 'cors-middleware' }).use(cors(securityConfig.cors))

const requestCounts = new Map<string, { count: number; resetTime: number }>()

export const rateLimiter = new Elysia({ name: 'rate-limiter' }).onBeforeHandle(
  ({ request, set }): { success: false; error: { code: string; message: string } } | void => {
    if (!securityConfig.isProduction) return

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const now = Date.now()
    const record = requestCounts.get(ip)

    if (!record || now > record.resetTime) {
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + securityConfig.rateLimit.windowMs,
      })
      return
    }

    record.count++

    if (record.count > securityConfig.rateLimit.max) {
      set.status = 429
      set.headers['Retry-After'] = String(Math.ceil((record.resetTime - now) / 1000))
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests' },
      }
    }
  },
)

setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of requestCounts) {
    if (now > record.resetTime) {
      requestCounts.delete(ip)
    }
  }
}, 60 * 1000)

export const securityMiddleware = new Elysia({ name: 'security' })
  .use(securityHeaders)
  .use(corsMiddleware)
  .use(rateLimiter)
