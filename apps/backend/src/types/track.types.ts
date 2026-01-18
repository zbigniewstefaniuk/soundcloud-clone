import type { tracks, users } from '../db/schema';

export type Track = typeof tracks.$inferSelect;

export type CreateTrackInput = Pick<
  typeof tracks.$inferInsert,
  'title' | 'description' | 'genre' | 'mainArtist' | 'isPublic'
>;

export type UpdateTrackInput = Partial<CreateTrackInput>;

export type TrackQueryParams = {
  page?: number;
  pageSize?: number;
  userId?: typeof tracks.$inferSelect.userId;
  search?: string;
  sortBy?: 'createdAt' | 'playCount';
  order?: 'asc' | 'desc';
};

export type TrackWithUser = Track & {
  user: Pick<typeof users.$inferSelect, 'id' | 'username'>;
  likeCount?: number;
  isLiked?: boolean;
};
