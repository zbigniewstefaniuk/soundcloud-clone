import { eq, and, or, ilike, desc, asc, sql, count } from 'drizzle-orm'
import { db } from '../config/database'
import { tracks, users, likes } from '../db/schema'
import { userProjection } from '../db/projections'
import { fileService } from './file.service'
import { embeddingService } from './embedding.service'
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/error'
import { calculatePagination, paginatedResult } from '../utils/pagination'
import { parseBooleanOrString } from '../utils/validation'
import { findOwnedTrackOrThrow } from '../utils/entity'

import type { TrackQueryParams, CreateTrackInput, UpdateTrackInput } from '~/utils/validation'

export class TrackService {
  async uploadTrack({ input, userId }: { userId: string; input: CreateTrackInput }) {
    console.log('Uploading track for user:', userId, input)
    const audioUrl = await fileService.uploadAudio(input.file, userId)

    // Generate embedding for semantic search
    const embedding = await embeddingService.generateTrackEmbedding({
      title: input.title,
      description: input.description,
      genre: input.genre,
      mainArtist: input.mainArtist,
    })

    return await db.transaction(async (tx) => {
      const [track] = await tx
        .insert(tracks)
        .values({
          userId,
          title: input.title,
          description: input.description,
          genre: input.genre,
          mainArtist: input.mainArtist,
          audioUrl,
          fileSize: input.file.size,
          mimeType: input.file.type,
          isPublic: parseBooleanOrString(input.isPublic) ?? false,
          metadataEmbedding: embedding,
        })
        .returning()

      if (!track) {
        throw new ValidationError('Failed to create track')
      }

      if (input.coverArt && input.coverArt instanceof File) {
        const coverArtUrl = await fileService.uploadCover(input.coverArt, track.id)
        const [updatedTrack] = await tx
          .update(tracks)
          .set({ coverArtUrl })
          .where(eq(tracks.id, track.id))
          .returning()
        return updatedTrack
      }

      return track
    })
  }

  async getTracks(query: TrackQueryParams, currentUserId?: string) {
    const { page, pageSize, offset } = calculatePagination(query)

    const result = await db.transaction(async (tx) => {
      const conditions = []

      if (query.userId) {
        // Filter by requested user
        conditions.push(eq(tracks.userId, query.userId))
        // If requester is NOT the owner, only show public tracks
        if (query.userId !== currentUserId) {
          conditions.push(eq(tracks.isPublic, true))
        }
        // If requester IS the owner, show all their tracks (public + private)
      } else {
        // No userId specified = public feed, only public tracks
        conditions.push(eq(tracks.isPublic, true))
      }

      if (query.search) {
        conditions.push(
          or(
            ilike(tracks.title, `%${query.search}%`),
            ilike(tracks.description, `%${query.search}%`),
          )!,
        )
      }

      const orderFn = query.order === 'asc' ? asc : desc

      // Determine order expression - likeCount requires ordering by aggregated column
      const getOrderExpression = () => {
        if (query.sortBy === 'likeCount') {
          return orderFn(sql`count(DISTINCT ${likes.id})`)
        } else if (query.sortBy === 'playCount') {
          return orderFn(tracks.playCount)
        }
        return orderFn(tracks.createdAt)
      }

      // Get total count
      const [totalResult] = await tx
        .select({ count: count() })
        .from(tracks)
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      const total = totalResult?.count || 0

      // Get tracks with user and like count
      const tracksData = await tx
        .select({
          track: tracks,
          user: userProjection,
          likeCount: sql<number>`count(DISTINCT ${likes.id})`,
        })
        .from(tracks)
        .leftJoin(users, eq(tracks.userId, users.id))
        .leftJoin(likes, eq(tracks.id, likes.trackId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(tracks.id, users.id, users.username)
        .orderBy(getOrderExpression())
        .limit(pageSize)
        .offset(offset)

      const paginatedResults = paginatedResult(
        //  we dont want to return metadataEmbedding
        // oxlint-disable-next-line no-unused-vars
        tracksData.map(({ track: { metadataEmbedding, ...track }, likeCount, user }) => ({
          ...track,
          user: user,
          likeCount: Number(likeCount) || 0,
        })),
        total,
        page,
        pageSize,
      )

      return paginatedResults
    })

    return result
  }

  async getTrackById(trackId: string, currentUserId?: string) {
    const [result] = await db
      .select({
        track: tracks,
        user: userProjection,
        likeCount: sql<number>`count(DISTINCT ${likes.id})`,
      })
      .from(tracks)
      .leftJoin(users, eq(tracks.userId, users.id))
      .leftJoin(likes, eq(tracks.id, likes.trackId))
      .where(eq(tracks.id, trackId))
      .groupBy(tracks.id, users.id, users.username)
      .limit(1)

    if (!result) {
      throw new NotFoundError('Track')
    }

    if (!result.track.isPublic && result.track.userId !== currentUserId) {
      throw new ForbiddenError('This track is private')
    }

    const { likeCount, track, user } = result

    //  we dont want to return metadataEmbedding
    // oxlint-disable-next-line no-unused-vars
    const { metadataEmbedding, ...trackWithoutEmbedding } = track

    return {
      ...trackWithoutEmbedding,
      user,
      likeCount: Number(likeCount) || 0,
    }
  }

  async updateTrack(trackId: string, userId: string, input: UpdateTrackInput) {
    const track = await findOwnedTrackOrThrow(trackId, userId, 'update')

    const { coverArt, ...updateData } = input

    // Check if metadata that affects embeddings has changed
    const metadataChanged =
      (updateData.title && updateData.title !== track.title) ||
      (updateData.description !== undefined && updateData.description !== track.description) ||
      (updateData.genre !== undefined && updateData.genre !== track.genre) ||
      (updateData.mainArtist !== undefined && updateData.mainArtist !== track.mainArtist)

    // Regenerate embedding if metadata changed
    let newEmbedding: number[] | undefined
    if (metadataChanged) {
      newEmbedding = await embeddingService.generateTrackEmbedding({
        title: updateData.title || track.title,
        description: updateData.description ?? track.description,
        genre: updateData.genre ?? track.genre,
        mainArtist: updateData.mainArtist ?? track.mainArtist,
      })
    }

    return await db.transaction(async (tx) => {
      let coverArtUrl: string | undefined
      if (coverArt && coverArt instanceof File) {
        coverArtUrl = await fileService.uploadCover(coverArt, trackId)
      }

      const [updated] = await tx
        .update(tracks)
        .set({
          ...updateData,
          isPublic: parseBooleanOrString(updateData.isPublic),
          ...(coverArtUrl ? { coverArtUrl } : {}),
          ...(newEmbedding ? { metadataEmbedding: newEmbedding } : {}),
          updatedAt: new Date(),
        })
        .where(eq(tracks.id, trackId))
        .returning()

      return updated
    })
  }

  async deleteTrack(trackId: string, userId: string) {
    const track = await findOwnedTrackOrThrow(trackId, userId, 'delete')

    await fileService.deleteFile(track.audioUrl)

    if (track.coverArtUrl) {
      await fileService.deleteFile(track.coverArtUrl)
    }

    await db.delete(tracks).where(eq(tracks.id, trackId))

    return { message: 'Track deleted successfully' }
  }

  async incrementPlayCount(trackId: string) {
    await db
      .update(tracks)
      .set({
        playCount: sql`${tracks.playCount} + 1`,
      })
      .where(eq(tracks.id, trackId))
  }
}

export const trackService = new TrackService()
