export interface StoredUser {
  id: string
  username: string
  email: string
}

class AuthStorage {
  private readonly TOKEN_KEY = 'auth_token'
  private readonly USER_KEY = 'auth_user'


  private get isBrowser(): boolean {
    return typeof window !== 'undefined'
  }

  /**
   * Token management
   */
  token = {
    /**
     * Get the stored JWT token
     */
    get: (): string | null => {
      if (!this.isBrowser) return null
      return localStorage.getItem(this.TOKEN_KEY)
    },

    /**
     * Store a JWT token
     */
    set: (token: string): void => {
      if (!this.isBrowser) return
      localStorage.setItem(this.TOKEN_KEY, token)
    },

    /**
     * Remove the stored token
     */
    remove: (): void => {
      if (!this.isBrowser) return
      localStorage.removeItem(this.TOKEN_KEY)
    },

    /**
     * Check if a token exists
     */
    exists: (): boolean => {
      return !!this.token.get()
    },
  }

  /**
   * StoredUser data management
   * Provides offline-first user data before API calls complete
   */
  user = {
    /**
     * Get the cached user data
     */
    get: (): StoredUser | null => {
      if (!this.isBrowser) return null
      try {
        const userData = localStorage.getItem(this.USER_KEY)
        if (!userData) return null
        return JSON.parse(userData) as StoredUser
      } catch {
        return null
      }
    },


    set: (user: StoredUser): void => {
      if (!this.isBrowser) return
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    },


    remove: (): void => {
      if (!this.isBrowser) return
      localStorage.removeItem(this.USER_KEY)
    },
  }


  setAuth(token: string, user: StoredUser): void {
    this.token.set(token)
    this.user.set(user)
  }


  clear(): void {
    this.token.remove()
    this.user.remove()
  }


  isAuthenticated(): boolean {
    return this.token.exists()
  }


  getHeaders(): Record<string, string> {
    const token = this.token.get()
    if (!token) return {}
    return {
      Authorization: `Bearer ${token}`,
    }
  }
}

/**
 * Singleton instance of AuthStorage
 */
export const authStorage = new AuthStorage()

