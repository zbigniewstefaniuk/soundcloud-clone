import type { App } from '@repo/backend/App'
import { treaty } from '@elysiajs/eden'
import { env } from '@/env'
import { authStorage } from '@/lib/auth-storage'

export const api = treaty<App>(env.VITE_API_URL, {
  headers: () => authStorage.getHeaders(),
})
