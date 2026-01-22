import { users } from './schema'

// Standard user projection for embedding in other queries
export const userProjection = {
  id: users.id,
  username: users.username,
} as const
