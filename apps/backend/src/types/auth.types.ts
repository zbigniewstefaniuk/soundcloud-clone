import type { users } from '../db/schema';

export type RegisterInput = {
  username: typeof users.$inferInsert.username;
  email: typeof users.$inferInsert.email;
  password: string;
};

export type LoginInput = {
  email: typeof users.$inferSelect.email;
  password: string;
};

export interface JWTPayload extends Record<string, any> {
  userId: typeof users.$inferSelect.id;
  username: typeof users.$inferSelect.username;
}

export type AuthResponse = {
  token: string;
  user: Pick<typeof users.$inferSelect, 'id' | 'username' | 'email'>;
};
