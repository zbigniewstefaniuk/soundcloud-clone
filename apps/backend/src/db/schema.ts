import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  boolean,
  uniqueIndex,
  customType,
  index,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// Custom type for pgvector - 384 dimensions for all-MiniLM-L6-v2 model
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(384)'
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
  fromDriver(value: string): number[] {
    // Handle both string format "[1,2,3]" and already parsed arrays
    if (Array.isArray(value)) return value
    return JSON.parse(value)
  },
})

export const users = pgTable('users', {
  id: varchar('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  username: varchar('username', { length: 30 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  salt: varchar('salt', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userProfiles = pgTable('user_profiles', {
  id: varchar('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: varchar('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  displayName: varchar('display_name', { length: 50 }),
  location: varchar('location', { length: 100 }),
  website: varchar('website', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const tracks = pgTable(
  'tracks',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    genre: varchar('genre', { length: 50 }), // Music genre
    mainArtist: varchar('main_artist', { length: 100 }), // Main artist name
    audioUrl: varchar('audio_url', { length: 500 }).notNull(),
    coverArtUrl: varchar('cover_art_url', { length: 500 }), // Album/track artwork
    fileSize: integer('file_size').notNull(), // in bytes
    mimeType: varchar('mime_type', { length: 50 }).notNull(),
    playCount: integer('play_count').default(0).notNull(),
    isPublic: boolean('is_public').default(true).notNull(),
    metadataEmbedding: vector('metadata_embedding'), // Vector embedding for semantic search
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // HNSW index for efficient vector similarity search on public tracks
    index('tracks_embedding_hnsw_idx')
      .using('hnsw', sql`${table.metadataEmbedding} vector_cosine_ops`)
      .where(sql`${table.isPublic} = true`),
  ],
)

export const likes = pgTable(
  'likes',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackId: varchar('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userTrackIdx: uniqueIndex('user_track_idx').on(table.userId, table.trackId),
  }),
)

export const comments = pgTable('comments', {
  id: varchar('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: varchar('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  trackId: varchar('track_id')
    .notNull()
    .references(() => tracks.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  timestamp: integer('timestamp'), // position in track (seconds)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  tracks: many(tracks),
  likes: many(likes),
  comments: many(comments),
}))

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}))

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  user: one(users, {
    fields: [tracks.userId],
    references: [users.id],
  }),
  likes: many(likes),
  comments: many(comments),
}))

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  track: one(tracks, {
    fields: [likes.trackId],
    references: [tracks.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  track: one(tracks, {
    fields: [comments.trackId],
    references: [tracks.id],
  }),
}))

// Export table object for drizzle-typebox
export const table = {
  users,
  userProfiles,
  tracks,
  likes,
  comments,
} as const

export type Table = typeof table

// Export all tables (including relations)
export const schema = {
  users,
  userProfiles,
  tracks,
  likes,
  comments,
  usersRelations,
  userProfilesRelations,
  tracksRelations,
  likesRelations,
  commentsRelations,
} as const
