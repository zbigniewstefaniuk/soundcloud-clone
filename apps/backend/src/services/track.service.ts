import { eq, and, or, ilike, desc, asc, sql, count } from 'drizzle-orm';
import { db } from '../config/database';
import { tracks, users, likes } from '../db/schema';
import { fileService } from './file.service';
import { NotFoundError, ForbiddenError } from '../middleware/error';
import { PAGINATION_DEFAULTS } from '../config/constants';

import type { TrackQueryParams, CreateTrackInput, UpdateTrackInput } from '~/utils/validation';

export class TrackService {
  async uploadTrack({ file, input, userId, coverArtFile }: {
    file: File,
    userId: string,
    input: CreateTrackInput
    coverArtFile?: File
  }) {
    const audioUrl = await fileService.uploadAudio(file, userId);

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
          fileSize: file.size,
          mimeType: file.type,
          isPublic: input.isPublic === 'true' ? true : input.isPublic === 'false',
        })
        .returning();

      if (!track) {
        throw new Error('Failed to create track');
      }

      if (coverArtFile && coverArtFile instanceof File) {
        const coverArtUrl = await fileService.uploadCover(coverArtFile, track.id);
        const [updatedTrack] = await tx
          .update(tracks)
          .set({ coverArtUrl })
          .where(eq(tracks.id, track.id))
          .returning();
        return updatedTrack;
      }

      return track;
    });
  }

  async getTracks(query: TrackQueryParams, _currentUserId?: string) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const pageSize = Math.min(
      query.pageSize || PAGINATION_DEFAULTS.pageSize,
      PAGINATION_DEFAULTS.maxPageSize
    );
    const offset = (page - 1) * pageSize;

    const conditions = [];

    // If userId is specified, get that user's tracks, otherwise only public
    if (query.userId) {
      conditions.push(eq(tracks.userId, query.userId));
    } else {
      conditions.push(eq(tracks.isPublic, true));
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(tracks.title, `%${query.search}%`),
          ilike(tracks.description, `%${query.search}%`)
        )!
      );
    }

    const orderColumn =
      query.sortBy === 'playCount' ? tracks.playCount : tracks.createdAt;
    const orderFn = query.order === 'asc' ? asc : desc;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(tracks)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult?.count || 0;

    // If no tracks, return empty result
    if (total === 0) {
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
        },
      };
    }

    // Get tracks with user and like count
    const tracksData = await db
      .select({
        track: tracks,
        user: {
          id: users.id,
          username: users.username,
        },
        likeCount: sql<number>`count(DISTINCT ${likes.id})`,
      })
      .from(tracks)
      .leftJoin(users, eq(tracks.userId, users.id))
      .leftJoin(likes, eq(tracks.id, likes.trackId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(tracks.id, users.id, users.username)
      .orderBy(orderFn(orderColumn))
      .limit(pageSize)
      .offset(offset);

    return {
      data: tracksData.map((t) => ({
        ...t.track,
        user: t.user,
        likeCount: Number(t.likeCount) || 0,
      })),
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  }

  async getTrackById(trackId: string, currentUserId?: string) {
    const [result] = await db
      .select({
        track: tracks,
        user: {
          id: users.id,
          username: users.username,
        },
        likeCount: sql<number>`count(DISTINCT ${likes.id})`,
      })
      .from(tracks)
      .leftJoin(users, eq(tracks.userId, users.id))
      .leftJoin(likes, eq(tracks.id, likes.trackId))
      .where(eq(tracks.id, trackId))
      .groupBy(tracks.id, users.id, users.username)
      .limit(1);

    if (!result) {
      throw new NotFoundError('Track');
    }

    if (!result.track.isPublic && result.track.userId !== currentUserId) {
      throw new ForbiddenError('This track is private');
    }

    return {
      ...result.track,
      user: result.user,
      likeCount: Number(result.likeCount) || 0,
    };
  }

  async updateTrack(
    trackId: string,
    userId: string,
    input: UpdateTrackInput
  ) {
    const [track] = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, trackId))
      .limit(1);

    if (!track) {
      throw new NotFoundError('Track');
    }

    if (track.userId !== userId) {
      throw new ForbiddenError('You can only update your own tracks');
    }

    const { coverArt, ...updateData } = input;

    return await db.transaction(async (tx) => {
      let coverArtUrl: string | undefined;
      if (coverArt && coverArt instanceof File) {
        coverArtUrl = await fileService.uploadCover(coverArt, trackId);
      }

      const [updated] = await tx
        .update(tracks)
        .set({
          ...updateData,
          isPublic: updateData.isPublic === 'true' ? true : updateData.isPublic === 'false' ? false : undefined,
          ...(coverArtUrl ? { coverArtUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(tracks.id, trackId))
        .returning();

      return updated;
    });
  }

  async deleteTrack(trackId: string, userId: string) {
    const [track] = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, trackId))
      .limit(1);

    if (!track) {
      throw new NotFoundError('Track');
    }

    if (track.userId !== userId) {
      throw new ForbiddenError('You can only delete your own tracks');
    }

    await fileService.deleteFile(track.audioUrl);

    if (track.coverArtUrl) {
      await fileService.deleteFile(track.coverArtUrl);
    }

    await db.delete(tracks).where(eq(tracks.id, trackId));

    return { message: 'Track deleted successfully' };
  }

  async incrementPlayCount(trackId: string) {
    await db
      .update(tracks)
      .set({
        playCount: sql`${tracks.playCount} + 1`,
      })
      .where(eq(tracks.id, trackId));
  }
}

export const trackService = new TrackService();
