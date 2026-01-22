import { eq, and } from 'drizzle-orm'
import { db } from '../config/database'
import { users, userProfiles, tracks } from '../db/schema'
import { NotFoundError } from '../middleware/error'
import type { UpdateProfileInput } from '~/utils/validation'

export class UserService {
  async getUserProfile(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
        profile: userProfiles,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const [updated] = await db
      .update(userProfiles)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning()

    if (!updated) {
      throw new NotFoundError('Profile')
    }

    return updated
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const [updated] = await db
      .update(userProfiles)
      .set({
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning()

    return updated
  }

  async getUserTracks(userId: string, includePrivate = false) {
    const conditions = [eq(tracks.userId, userId)]

    if (!includePrivate) {
      conditions.push(eq(tracks.isPublic, true))
    }

    return db.select().from(tracks).where(and(...conditions))
  }
}

export const userService = new UserService()
