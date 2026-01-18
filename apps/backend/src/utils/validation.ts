import { t } from 'elysia';
import { db } from '../db/models';

// Get user insert fields
const { users } = db.insert;

// Auth schemas - built from Drizzle schema
export const RegisterSchema = t.Object({
  username: users.username,
  email: users.email,
  password: t.String({ minLength: 8 }),
});

export type RegisterInput = typeof RegisterSchema['static'];


export const LoginSchema = t.Object({
  email: users.email,
  password: t.String({ minLength: 1 }),
});

export type LoginInput = typeof LoginSchema['static'];

// Get other insert fields
const { userProfiles, tracks, comments } = db.insert;

export const UpdateProfileSchema = t.Object({
  bio: t.Optional(userProfiles.bio),
  displayName: t.Optional(userProfiles.displayName),
  location: t.Optional(userProfiles.location),
  website: t.Optional(userProfiles.website),
});

export type UpdateProfileInput = typeof UpdateProfileSchema['static'];


// FormData sends booleans as strings, so accept both
const BooleanOrString = t.Union([
  t.Boolean(),
  t.Literal('true'),
  t.Literal('false'),
]);

export type BooleanOrString = typeof BooleanOrString['static'];

export const CreateTrackSchema = t.Object({
  title: tracks.title,
  description: t.Optional(tracks.description),
  genre: t.Optional(tracks.genre),
  mainArtist: t.Optional(tracks.mainArtist),
  isPublic: t.Optional(BooleanOrString),
  file: t.File({ maxSize: '100m' }),
  coverArt: t.Optional(t.File({ maxSize: '10m' })),
});

export type CreateTrackInput = typeof CreateTrackSchema['static'];


export const UpdateTrackSchema = t.Object({
  title: t.Optional(tracks.title),
  description: t.Optional(tracks.description),
  genre: t.Optional(tracks.genre),
  mainArtist: t.Optional(tracks.mainArtist),
  isPublic: t.Optional(BooleanOrString),
  file: t.Optional(t.File({ maxSize: '100m' })),
  coverArt: t.Optional(t.File({ maxSize: '10m' })),
});

export type UpdateTrackInput = typeof UpdateTrackSchema['static'];

export const CreateCommentSchema = t.Object({
  content: t.String({ minLength: 1, maxLength: 1000 }),
  timestamp: t.Optional(comments.timestamp),
});

export type CreateCommentInput = typeof CreateCommentSchema['static'];

export const UpdateCommentSchema = t.Object({
  content: t.String({ minLength: 1, maxLength: 1000 }),
});

export type UpdateCommentInput = typeof UpdateCommentSchema['static'];

export const PaginationSchema = t.Object({
  page: t.Optional(t.Integer({ minimum: 1 })),
  pageSize: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
});

export type PaginationParams = typeof PaginationSchema['static'];

export const TrackQuerySchema = t.Intersect([
  PaginationSchema,
  t.Object({
    userId: t.Optional(t.String()),
    search: t.Optional(t.String()),
    sortBy: t.Optional(
      t.Union([t.Literal('createdAt'), t.Literal('playCount')]),
    ),
    order: t.Optional(
      t.Union([t.Literal('asc'), t.Literal('desc')]),
    ),
  }),
]);

export type TrackQueryParams = typeof TrackQuerySchema['static'];


