import type { users, userProfiles } from '../db/schema';

export type UserProfile = typeof userProfiles.$inferSelect;

export type UpdateProfileInput = Pick<
  typeof userProfiles.$inferInsert,
  'bio' | 'displayName' | 'location' | 'website'
>;

export type UserWithProfile = Pick<
  typeof users.$inferSelect,
  'id' | 'username' | 'email' | 'createdAt'
> & {
  profile?: UserProfile;
};
