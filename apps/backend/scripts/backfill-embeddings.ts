/**
 * Backfill script for generating embeddings for existing tracks
 * Run with: bun run scripts/backfill-embeddings.ts
 */

import { db } from '../src/config/database'
import { tracks } from '../src/db/schema'
import { embeddingService } from '../src/services/embedding.service'
import { eq, isNull, and, sql } from 'drizzle-orm'

const BATCH_SIZE = 100
const CONCURRENCY = 10

async function backfillEmbeddings() {
  console.log('🚀 Starting embedding backfill...')

  // Initialize the embedding service
  await embeddingService.initialize()

  let processed = 0
  let failed = 0
  let hasMore = true

  while (hasMore) {
    // Get batch of public tracks without embeddings
    const batch = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        description: tracks.description,
        genre: tracks.genre,
        mainArtist: tracks.mainArtist,
      })
      .from(tracks)
      .where(and(isNull(tracks.metadataEmbedding), eq(tracks.isPublic, true)))
      .limit(BATCH_SIZE)

    if (batch.length === 0) {
      hasMore = false
      break
    }

    console.log(`\n📦 Processing batch of ${batch.length} tracks...`)

    // Process batch in parallel with concurrency limit
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY)

      await Promise.all(
        chunk.map(async (track) => {
          try {
            const embedding = await embeddingService.generateTrackEmbedding({
              title: track.title,
              description: track.description,
              genre: track.genre,
              mainArtist: track.mainArtist,
            })

            await db
              .update(tracks)
              .set({ metadataEmbedding: embedding })
              .where(eq(tracks.id, track.id))

            processed++
            console.log(`  ✅ [${processed}] ${track.title}`)
          } catch (error) {
            failed++
            console.error(`  ❌ Failed to process track ${track.id} (${track.title}):`, error)
          }
        }),
      )
    }

    console.log(`📊 Progress: ${processed} processed, ${failed} failed`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 Backfill complete!')
  console.log(`   Total processed: ${processed}`)
  console.log(`   Total failed: ${failed}`)
  console.log('='.repeat(50))

  process.exit(failed > 0 ? 1 : 0)
}

backfillEmbeddings().catch((error) => {
  console.error('❌ Backfill failed:', error)
  process.exit(1)
})
