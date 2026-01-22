import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { users, userProfiles } from '../db/schema'
import { hashPassword, verifyPassword, generateSalt } from '../utils/password'
import { AuthError, ConflictError, ValidationError } from '../middleware/error'
import type { AuthResponse, JWTPayload } from '../types/auth.types'
import type { RegisterInput, LoginInput } from '~/utils/validation'

export class AuthService {
  async register(
    input: RegisterInput,
    jwtSign: (payload: JWTPayload) => Promise<string>,
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1)

    if (existingUser.length > 0) {
      throw new ConflictError('Email already registered')
    }

    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, input.username))
      .limit(1)

    if (existingUsername.length > 0) {
      throw new ConflictError('Username already taken')
    }

    // Hash password
    const salt = generateSalt()
    const hashedPassword = await hashPassword(input.password)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: input.username,
        email: input.email,
        password: hashedPassword,
        salt,
      })
      .returning()

    if (!newUser) {
      throw new ValidationError('Failed to create user')
    }

    // Create empty profile
    await db.insert(userProfiles).values({
      userId: newUser.id,
    })

    // Generate JWT
    const token = await jwtSign({
      userId: newUser.id,
      username: newUser.username,
    })

    return {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    }
  }

  async login(
    input: LoginInput,
    jwtSign: (payload: JWTPayload) => Promise<string>,
  ): Promise<AuthResponse> {
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1)

    // Always verify password to prevent timing attacks (email enumeration)
    // Use a dummy hash when user not found to normalize response time
    const dummyHash = '$2b$10$dummyhashfortimingsafetynormalization'
    const isValid = await verifyPassword(input.password, user?.password ?? dummyHash)

    if (!user || !isValid) {
      throw new AuthError('Invalid credentials')
    }

    // Generate JWT
    const token = await jwtSign({
      userId: user.id,
      username: user.username,
    })

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    }
  }

  async getCurrentUser(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
        profile: userProfiles,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new AuthError('User not found')
    }

    return user
  }
}

export const authService = new AuthService()
