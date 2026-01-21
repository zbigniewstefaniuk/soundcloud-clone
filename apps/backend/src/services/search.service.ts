import { sql, eq, and, or, ilike, desc } from 'drizzle-orm'
import { db } from '../config/database'
import { tracks, users, likes } from '../db/schema'
import { embeddingService } from './embedding.service'

export interface SearchResult {
  id: string
  title: string
  description: string | null
  genre: string | null
  mainArtist: string | null
  coverArtUrl: string | null
  playCount: number
  similarity: number
  user: {
    id: string
    username: string
  } | null
  likeCount: number
}

export interface SearchParams {
  query: string
  limit?: number
  threshold?: number // Minimum similarity score (0-1)
}

class SearchService {
  /**
   * Perform semantic similarity search on public tracks
   * Uses pgvector cosine distance operator <=>
   */
  async searchTracks(params: SearchParams): Promise<SearchResult[]> {
    const { query, limit = 20, threshold = 0.3 } = params

    // Generate embedding for search query
    const queryEmbedding = await embeddingService.generateQueryEmbedding(query)
    const embeddingStr = `[${queryEmbedding.join(',')}]`

    // Perform vector similarity search
    // Cosine similarity = 1 - cosine distance
    const results = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        description: tracks.description,
        genre: tracks.genre,
        mainArtist: tracks.mainArtist,
        coverArtUrl: tracks.coverArtUrl,
        playCount: tracks.playCount,
        userId: users.id,
        username: users.username,
        likeCount: sql<number>`count(DISTINCT ${likes.id})`,
        similarity: sql<number>`1 - (${tracks.metadataEmbedding} <=> ${embeddingStr}::vector)`,
      })
      .from(tracks)
      .leftJoin(users, eq(tracks.userId, users.id))
      .leftJoin(likes, eq(tracks.id, likes.trackId))
      .where(
        and(
          eq(tracks.isPublic, true),
          sql`${tracks.metadataEmbedding} IS NOT NULL`,
          sql`1 - (${tracks.metadataEmbedding} <=> ${embeddingStr}::vector) >= ${threshold}`,
        ),
      )
      .groupBy(
        tracks.id,
        tracks.title,
        tracks.description,
        tracks.genre,
        tracks.mainArtist,
        tracks.coverArtUrl,
        tracks.playCount,
        tracks.metadataEmbedding,
        users.id,
        users.username,
      )
      .orderBy(sql`${tracks.metadataEmbedding} <=> ${embeddingStr}::vector`)
      .limit(limit)

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      genre: r.genre,
      mainArtist: r.mainArtist,
      coverArtUrl: r.coverArtUrl,
      playCount: r.playCount,
      similarity: Number(r.similarity) || 0,
      user: r.userId
        ? {
            id: r.userId,
            username: r.username!,
          }
        : null,
      likeCount: Number(r.likeCount) || 0,
    }))
  }

  /**
   * Hybrid search: combine vector similarity with keyword matching
   * Falls back to keyword search if insufficient vector results
   */
  async hybridSearch(params: SearchParams): Promise<SearchResult[]> {
    const { query, limit = 20 } = params

    // First try vector search
    const vectorResults = await this.searchTracks(params)

    // If we have enough good vector results, return them
    if (vectorResults.length >= 5) {
      return vectorResults
    }

    // Supplement with keyword search for short queries or when vector search underperforms
    const keywordResults = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        description: tracks.description,
        genre: tracks.genre,
        mainArtist: tracks.mainArtist,
        coverArtUrl: tracks.coverArtUrl,
        playCount: tracks.playCount,
        userId: users.id,
        username: users.username,
        likeCount: sql<number>`count(DISTINCT ${likes.id})`,
      })
      .from(tracks)
      .leftJoin(users, eq(tracks.userId, users.id))
      .leftJoin(likes, eq(tracks.id, likes.trackId))
      .where(
        and(
          eq(tracks.isPublic, true),
          or(
            ilike(tracks.title, `%${query}%`),
            ilike(tracks.description, `%${query}%`),
            ilike(tracks.genre, `%${query}%`),
            ilike(tracks.mainArtist, `%${query}%`),
          ),
        ),
      )
      .groupBy(
        tracks.id,
        tracks.title,
        tracks.description,
        tracks.genre,
        tracks.mainArtist,
        tracks.coverArtUrl,
        tracks.playCount,
        users.id,
        users.username,
      )
      .orderBy(desc(tracks.playCount))
      .limit(limit - vectorResults.length)

    // Merge results, removing duplicates
    const seenIds = new Set(vectorResults.map((r) => r.id))
    const combined = [...vectorResults]

    for (const r of keywordResults) {
      if (!seenIds.has(r.id)) {
        combined.push({
          id: r.id,
          title: r.title,
          description: r.description,
          genre: r.genre,
          mainArtist: r.mainArtist,
          coverArtUrl: r.coverArtUrl,
          playCount: r.playCount,
          similarity: 0, // No vector similarity for keyword matches
          user: r.userId
            ? {
                id: r.userId,
                username: r.username!,
              }
            : null,
          likeCount: Number(r.likeCount) || 0,
        })
        seenIds.add(r.id)
      }
    }

    return combined
  }
}

export const searchService = new SearchService()
