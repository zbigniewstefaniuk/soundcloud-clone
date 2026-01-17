import type { User } from '../api/auth'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * Token management
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * User data management
 * This provides offline-first user data before the API call completes
 */
export function getCachedUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const userData = localStorage.getItem(USER_KEY)
    if (!userData) return null
    return JSON.parse(userData) as User
  } catch {
    return null
  }
}

export function setCachedUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function removeCachedUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_KEY)
}

/**
 * Clear all auth data
 */
export function clearAuth(): void {
  removeToken()
  removeCachedUser()
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  if (!token) return {}
  return {
    Authorization: `Bearer ${token}`,
  }
}

/**
 * Check if user is authenticated based on token presence
 */
export function hasAuthToken(): boolean {
  return !!getToken()
}
