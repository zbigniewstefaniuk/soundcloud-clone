import createClient from 'openapi-fetch'
import type { paths } from './generated/schema'
import { getAuthHeaders } from '../lib/auth-storage'
import { env } from '@/env';

const API_URL = env.VITE_API_URL;

export const apiClient = createClient<paths>({
  baseUrl: API_URL,
})

// Request interceptor to add auth headers
apiClient.use({
  async onRequest({ request }) {
    const authHeaders = getAuthHeaders()
    for (const [key, value] of Object.entries(authHeaders)) {
      request.headers.set(key, value)
    }
    return request
  },
})

