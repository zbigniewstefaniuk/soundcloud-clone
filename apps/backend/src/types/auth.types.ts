import type { users } from '../db/schema'

export interface JWTPayload extends Record<string, any> {
  userId: typeof users.$inferSelect.id
  username: typeof users.$inferSelect.username
}

export type AuthResponse = {
  token: string
  user: Pick<typeof users.$inferSelect, 'id' | 'username' | 'email'>
}
