import { t } from 'elysia';
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox';

import { table } from './schema';
import { spreads } from './utils';

export const db = {
  insert: spreads(
    {
      users: createInsertSchema(table.users, {
        email: t.String({ format: 'email' }),
      }),
      userProfiles: createInsertSchema(table.userProfiles),
      tracks: createInsertSchema(table.tracks),
      likes: createInsertSchema(table.likes),
      comments: createInsertSchema(table.comments),
    },
    'insert'
  ),
  select: spreads(
    {
      users: createSelectSchema(table.users, {
        email: t.String({ format: 'email' }),
      }),
      userProfiles: createSelectSchema(table.userProfiles),
      tracks: createSelectSchema(table.tracks),
      likes: createSelectSchema(table.likes),
      comments: createSelectSchema(table.comments),
    },
    'select'
  ),
} as const;
