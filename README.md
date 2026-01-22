# Elysia Monorepo

A Turborepo monorepo with Elysia backend and Vite React frontend.

## Project Structure

```
elysia-monorepo/
├── apps/
│   ├── backend/          # Elysia + Drizzle ORM backend
│   └── web/              # Vite + React frontend
├── packages/
│   └── typescript-config/ # Shared TypeScript configurations
├── turbo.json            # Turborepo configuration
└── package.json          # Root package.json
```

## Apps

### Backend (`@repo/backend`)

- **Framework**: Elysia.js
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: JWT authentication
- **Validation**: drizzle-typebox
- **Linting**: oxlint
- **Runtime**: Bun

### Frontend (`@repo/web`)

- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Port**: 3000

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.6
- [PostgreSQL](https://www.postgresql.org/) (for backend)
- [Docker](https://www.docker.com/) (optional, for containerized DB)

### Installation

1. **Install dependencies**:

   ```bash
   cd elysia-monorepo
   npm i
   ```

2. **Setup backend environment**:

   ```bash
   cd apps/backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start PostgreSQL** (using Docker):

   ```bash
   cd apps/backend
   docker-compose up -d
   ```

4. **Run migrations**:

   ```bash
   cd apps/backend
   bun run db:migrate
   ```

## Development

### Run all apps in development mode

```bash
bun run dev
```

This starts:

- Backend on `http://localhost:8000`
- Frontend on `http://localhost:3000`

### Run individual apps

**Backend only:**

```bash
turbo run dev --filter=@repo/backend
```

**Frontend only:**

```bash
turbo run dev --filter=@repo/web
```

## Available Scripts

### Root Level

- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all apps
- `bun run lint` - Lint all apps
- `bun run type-check` - Type check all apps
- `bun run clean` - Clean all build artifacts

### Backend (`apps/backend`)

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Drizzle Studio
- `bun run lint` - Lint with oxlint

### Frontend (`apps/web`)

- `bun run dev` - Start Vite dev server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Lint with ESLint
- `bun run type-check` - TypeScript type checking

## Tech Stack

### Backend

- **Runtime**: Bun
- **Framework**: Elysia.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: drizzle-typebox
- **Auth**: @elysiajs/jwt
- **API Docs**: @elysiajs/openapi
- **Linter**: oxlint

### Frontend

- **Framework**: React 19
- **Build**: Vite 7
- **Language**: TypeScript 5
- **Linter**: ESLint 9

### Monorepo

- **Tool**: Turborepo 2.7
- **Package Manager**: NPM(workspace - frontend) / BUN (backend)

## Turborepo Features

- **Parallel execution**: Run tasks across packages simultaneously
- **Smart caching**: Cache build outputs and skip redundant work
- **Task dependencies**: Define relationships between tasks
- **Filtering**: Run commands for specific packages

## Environment Variables

### Backend (`apps/backend/.env`)

```env
DATABASE_URL=postgres://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
```

## API Documentation

Backend API documentation is available at:

- `http://localhost:8000/openapi` (openapi UI)

## Database Management

**Generate migration:**

```bash
cd apps/backend
bun run db:generate
```

**Run migrations:**

```bash
cd apps/backend
bun run db:migrate
```

**Open Drizzle Studio:**

```bash
cd apps/backend
bun run db:studio
```

## Vector Search (Semantic Search)

The backend includes semantic search capabilities using vector embeddings, allowing users to search tracks by meaning rather than exact keyword matches.

### Technology Stack

- **PostgreSQL + pgvector**: Vector storage and similarity search
- **Hugging Face Transformers**: Local embedding generation
- **Model**: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, ~22MB)
- **Index**: HNSW (Hierarchical Navigable Small World) for fast approximate nearest neighbor search

### How It Works

1. Track metadata (title, description, genre, artist) is combined and converted into a 384-dimensional vector embedding
2. Search queries are similarly converted to embeddings
3. PostgreSQL's pgvector extension performs cosine similarity search to find the most relevant tracks
4. Hybrid search falls back to keyword matching when vector results are insufficient

### Setup

1. **Enable pgvector extension:**

   ```bash
   cd apps/backend
   bun run scripts/setup-pgvector.ts
   ```

   This script checks for pgvector availability, enables the extension, and creates the necessary column and HNSW index.

2. **Backfill embeddings for existing tracks:**

   ```bash
   cd apps/backend
   bun run scripts/backfill-embeddings.ts
   ```

   This generates embeddings for all existing public tracks that don't have embeddings yet.

### API Endpoint

**Search tracks:**

```
GET /search/tracks?q=<query>&limit=20&threshold=0.3
```

| Parameter   | Type    | Default | Description                          |
| ----------- | ------- | ------- | ------------------------------------ |
| `q`         | string  | -       | Search query (1-200 characters)      |
| `limit`     | integer | 20      | Max results (1-50)                   |
| `threshold` | number  | 0.3     | Minimum similarity score (0-1)       |

**Response:**

```json
{
  "data": [
    {
      "id": "track_id",
      "title": "Track Title",
      "description": "Track description",
      "genre": "Electronic",
      "mainArtist": "Artist Name",
      "coverArtUrl": "https://...",
      "playCount": 100,
      "similarity": 0.85,
      "user": { "id": "user_id", "username": "username" },
      "likeCount": 10
    }
  ]
}
```

### Docker Setup for pgvector

If using Docker, use the pgvector image:

```bash
docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 pgvector/pgvector:pg16
```

Or update your `docker-compose.yml` to use `pgvector/pgvector:pg16` instead of the standard PostgreSQL image.

## Production Build

```bash
# Build all apps
npm run build

# Start backend in production
cd apps/backend
npm run start

# Preview frontend build
cd apps/web
npm run preview
```

## Adding Packages

### Add to specific app

```bash
# Backend
bun add <package> --filter=@repo/backend

# Frontend
npm add <package> --filter=@repo/web
```

### Add to root

```bash
bun add <package> -D
```

## Shared Packages

Shared TypeScript configurations are in `packages/typescript-config`:

- `base.json` - Base TypeScript config
- `react.json` - React-specific config
- `node.json` - Node.js/Bun-specific config

## License

MIT
