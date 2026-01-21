-- Enable pgvector extension (requires PostgreSQL with pgvector installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to tracks table (384 dimensions for all-MiniLM-L6-v2)
ALTER TABLE tracks ADD COLUMN metadata_embedding vector(384);

-- Create HNSW index for efficient similarity search on public tracks only
CREATE INDEX tracks_embedding_hnsw_idx ON tracks
  USING hnsw (metadata_embedding vector_cosine_ops)
  WHERE is_public = true;
