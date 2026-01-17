# Drizzle ORM Integration with Elysia

This document outlines the Drizzle ORM integration following the official Elysia documentation.

## Changes Made

### 1. TypeBox Version Pinning
**File:** [package.json](package.json)

Added `overrides` field to pin `@sinclair/typebox` version to prevent conflicts between drizzle-typebox and Elysia:

```json
{
  "overrides": {
    "@sinclair/typebox": "0.34.47"
  }
}
```

### 2. Schema Export Structure
**File:** [src/db/schema.ts](src/db/schema.ts)

Added `table` export for use with drizzle-typebox:

```typescript
export const table = {
  users,
  userProfiles,
  tracks,
  likes,
  comments,
} as const;

export type Table = typeof table;
```

### 3. Utility Functions
**File:** [src/db/utils.ts](src/db/utils.ts) (new file)

Created spread utility functions as recommended by Elysia docs:

- `spread()`: Converts a single Drizzle schema into a plain object
- `spreads()`: Converts multiple Drizzle schemas into plain objects

These utilities prevent "Type instantiation is possibly infinite" errors by breaking the circular reference between drizzle-typebox and Elysia schemas.

### 4. Models Singleton
**File:** [src/db/models.ts](src/db/models.ts) (new file)

Created a singleton pattern for database models with two modes:

```typescript
export const db = {
  insert: spreads({ /* insert schemas */ }, 'insert'),
  select: spreads({ /* select schemas */ }, 'select')
} as const;
```

Benefits:
- Single source of truth for validation schemas
- Automatically synced with database schema
- Type-safe field access
- Email validation refinement on users table

### 5. Validation Schemas
**File:** [src/utils/validation.ts](src/utils/validation.ts)

Updated to use drizzle-typebox schemas instead of manually defined TypeBox schemas:

**Before:**
```typescript
import { Type } from '@sinclair/typebox';

export const RegisterSchema = Type.Object({
  username: Type.String({ minLength: 3, maxLength: 30 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
});
```

**After:**
```typescript
import { t } from 'elysia';
import { db } from '../db/models';

const { users } = db.insert;

export const RegisterSchema = t.Object({
  username: users.username,
  email: users.email,
  password: t.String({ minLength: 8 }),
});
```

## Benefits

1. **Single Source of Truth**: Database schema drives validation
2. **Type Safety**: Changes to database schema automatically reflect in validation
3. **No Duplication**: Field constraints defined once in Drizzle schema
4. **Automatic OpenAPI**: Validation schemas auto-generate API documentation
5. **Prevention of Errors**: Utility functions prevent TypeScript circular reference issues

## Architecture Flow

```
Drizzle Schema
      ↓
drizzle-typebox
      ↓
Spread Utilities
      ↓
Models Singleton (db.insert / db.select)
      ↓
Validation Schemas
      ↓
Route Handlers
      ↓
OpenAPI Documentation
```

## Usage Example

### Define Schema Once
```typescript
// src/db/schema.ts
export const users = pgTable('users', {
  username: varchar('username', { length: 30 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
});
```

### Use in Validation
```typescript
// src/utils/validation.ts
const { users } = db.insert;

export const RegisterSchema = t.Object({
  username: users.username,  // Automatically gets length: 30, notNull, etc.
  email: users.email,        // Automatically validated as email format
  password: t.String({ minLength: 8 }),  // Custom validation
});
```

### Use in Routes
```typescript
// src/routes/auth.routes.ts
.post('/register', async ({ body, jwt }) => {
  const result = await authService.register(body, jwt.sign);
  return success(result);
}, {
  body: RegisterSchema,  // Type-safe validation
});
```

## Error Handling

The existing error handling in [src/middleware/error.ts](src/middleware/error.ts) continues to work seamlessly with drizzle-typebox validation errors:

- Validation errors are automatically parsed and formatted
- User-friendly error messages
- Standardized error response format

## Next Steps

To add a new table with validation:

1. Define table in [src/db/schema.ts](src/db/schema.ts)
2. Add to `table` export
3. Add insert/select schemas to [src/db/models.ts](src/db/models.ts)
4. Create validation schemas in [src/utils/validation.ts](src/utils/validation.ts) using `db.insert` or `db.select`
5. Use in routes

That's it! No need to duplicate field constraints.
