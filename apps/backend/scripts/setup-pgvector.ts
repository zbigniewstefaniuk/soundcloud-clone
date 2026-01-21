import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = postgres(DATABASE_URL)

async function main() {
  console.log('🔍 Checking pgvector extension...\n')

  // Check if pgvector extension is available
  try {
    const extensions = await sql`
      SELECT name, default_version, installed_version
      FROM pg_available_extensions
      WHERE name = 'vector'
    `

    if (extensions.length === 0) {
      console.error('❌ pgvector extension is NOT available on your PostgreSQL server.')
      console.log('\nTo install pgvector, you have several options:\n')
      console.log('1. If using Docker, use the pgvector/pgvector image:')
      console.log(
        '   docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 pgvector/pgvector:pg16\n',
      )
      console.log(
        '2. If using a managed database (Supabase, Neon, etc.), enable the pgvector extension in their dashboard.\n',
      )
      console.log('3. If self-hosting PostgreSQL, install pgvector:')
      console.log('   - Ubuntu/Debian: sudo apt install postgresql-16-pgvector')
      console.log('   - macOS with Homebrew: brew install pgvector')
      console.log('   - From source: https://github.com/pgvector/pgvector#installation\n')
      await sql.end()
      process.exit(1)
    }

    console.log('✅ pgvector extension is available')
    console.log(`   Version: ${extensions[0].default_version}`)
    console.log(`   Installed: ${extensions[0].installed_version || 'No'}\n`)

    // Try to enable the extension
    if (!extensions[0].installed_version) {
      console.log('🔧 Enabling pgvector extension...')
      await sql`CREATE EXTENSION IF NOT EXISTS vector`
      console.log('✅ pgvector extension enabled!\n')
    }

    // Check if metadata_embedding column exists
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tracks' AND column_name = 'metadata_embedding'
    `

    if (columns.length === 0) {
      console.log('🔧 Adding metadata_embedding column to tracks table...')
      await sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS metadata_embedding vector(384)`
      console.log('✅ Column added!\n')

      // Create the HNSW index
      console.log('🔧 Creating HNSW index for similarity search...')
      await sql`
        CREATE INDEX IF NOT EXISTS tracks_embedding_hnsw_idx
        ON tracks USING hnsw (metadata_embedding vector_cosine_ops)
        WHERE is_public = true
      `
      console.log('✅ Index created!\n')
    } else {
      console.log('✅ metadata_embedding column already exists\n')
    }

    console.log('🎉 pgvector setup complete! You can now use vector search.')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main()
