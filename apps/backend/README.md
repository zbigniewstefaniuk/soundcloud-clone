A SoundCloud-like music streaming backend built with Elysia.js, PostgreSQL, and Drizzle ORM.

## 🚀 Quick Start

### Prerequisites

- Bun installed
- Docker and Docker Compose

### Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Start PostgreSQL**

   ```bash
   docker-compose up -d
   ```

3. **Run migrations**

   ```bash
   bun run db:generate
   bun run db:migrate
   ```

4. **Start the server**

   ```bash
   bun run dev
   ```

The API will be available at `http://localhost:3000`
API Documentation: `http://localhost:3000/swagger`

---

## 🗄️ Database Management

### View Database

```bash
bun run db:studio
```

This opens Drizzle Studio at `https://local.drizzle.studio`

### Create New Migration

```bash
# 1. Update src/db/schema.ts
# 2. Generate migration
bun run db:generate
# 3. Apply migration
bun run db:migrate
```

---

## 📁 Project Structure

```
src/
├── config/          # Configuration files (env, database, constants)
├── db/              # Database schema and migrations
├── middleware/      # Auth middleware and error handlers
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
└── utils/           # Utility functions (password, validation, response)
```

---

## 🔒 Security Features

- **Password Security**: Bcrypt hashing with 12 salt rounds
- **JWT Authentication**: Secure token-based auth
- **File Validation**: Type and size checks for uploads
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **Authorization**: Resource ownership verification
- **CORS**: Configured for cross-origin requests

---

## 📦 File Upload Limits

- **Audio Files**: 10MB max
  - Supported: MP3, WAV, OGG, AAC
- **Images**: 2MB max
  - Supported: JPEG, PNG, WebP

---

## 🛠️ Development

### Environment Variables

See `.env.example` for required environment variables.

### Testing Endpoints

Use the Swagger UI at `http://localhost:3000/swagger` to test all endpoints interactively.

---

## 🐳 Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f

# Remove volumes (reset database)
docker-compose down -v
```

---

## 📝 Response Format

All responses follow this format:

**Success:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

**Paginated:**

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
