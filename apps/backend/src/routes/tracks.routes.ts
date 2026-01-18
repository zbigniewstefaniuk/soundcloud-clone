import { Elysia, t } from 'elysia';
import { jwtPlugin, authMiddleware } from '../middleware/auth';
import { trackService } from '../services/track.service';
import { success, paginated } from '../utils/response';
import {
  CreateTrackSchema,
  TrackQuerySchema, UpdateTrackSchema } from '../utils/validation';

export const trackRoutes = new Elysia({ prefix: '/tracks' })
  .use(jwtPlugin)
  .get(
    '/',
    async ({ query }) => {
      const result = await trackService.getTracks(query);
      return paginated(result.data, result.pagination);
    },
    {
      query: TrackQuerySchema,
      detail: {
        tags: ['Tracks'],
        summary: 'List tracks',
        description: 'Get paginated list of public tracks with filters',
      },
    },
  )
  .get(
    '/:id',
    async ({ params }) => {
      const track = await trackService.getTrackById(params.id);
      return success(track);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Tracks'],
        summary: 'Get track',
        description: 'Get single track by ID',
      },
    },
  )
  .get(
    '/:id/stream',
    async ({ params, set, request, jwt }) => {
      console.log('[Stream] Requested Track ID:', params.id);

      // Try to get current user from JWT (optional auth for private tracks)
      // Check both Authorization header and query param (for audio element which can't send headers)
      let currentUserId: string | undefined;
      try {
        const authHeader = request.headers.get('authorization');
        const url = new URL(request.url);
        const queryToken = url.searchParams.get('token');

        const token = authHeader?.startsWith('Bearer ')
          ? authHeader.substring(7)
          : queryToken;

        if (token) {
          const payload = await jwt.verify(token);
          if (payload && typeof payload === 'object' && 'userId' in payload) {
            currentUserId = payload.userId as string;
          }
        }
      } catch {
        // Ignore auth errors - user is just not logged in
      }

      let track;
      try {
        track = await trackService.getTrackById(params.id, currentUserId);
      } catch (error) {
        console.error('[Stream] Error fetching track:', error);
        throw error;
      }

      console.log('[Stream] Track found, audioUrl:', track.audioUrl);
      console.log('[Stream] mimeType:', track.mimeType);

      const file = Bun.file(track.audioUrl);
      const exists = await file.exists();
      console.log('[Stream] File exists:', exists);

      if (!exists) {
        set.status = 404;
        return {
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'Audio file not found on server',
          },
        };
      }

      await trackService.incrementPlayCount(params.id);

      const fileSize = file.size;
      const rangeHeader = request.headers.get('range');

      set.headers['Accept-Ranges'] = 'bytes';
      set.headers['Content-Type'] = track.mimeType;

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (match) {
          const start = match[1] ? parseInt(match[1], 10) : 0;
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
          const chunkSize = end - start + 1;

          set.status = 206;
          set.headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
          set.headers['Content-Length'] = chunkSize.toString();

          return file.slice(start, end + 1);
        }
      }

      set.headers['Content-Length'] = fileSize.toString();
      return file;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Tracks'],
        summary: 'Stream track',
        description: 'Stream audio file with range request support',
      },
    },
  )
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, user }) => {
      const { file, title, description, genre, mainArtist, isPublic, coverArt } =
        body 

      console.log('body-==--==--=-=', body);

      if (!file || !(file instanceof File)) {
        throw new Error('Audio file is required');
      }

      const track = await trackService.uploadTrack({
        userId: user.userId,
        input: {
          ...body,
          title,
          description,
          genre,
          mainArtist,
          isPublic: isPublic === 'true' || isPublic === true,
          file,
          coverArt,
        }
      });

      return success(track);
    },
    {
      body: CreateTrackSchema,
      detail: {
        tags: ['Tracks'],
        summary: 'Upload track',
        description: 'Upload a new music track',
      },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user, }) => {
      const { isPublic, ...rest } = body;

      const updateData = {
        ...rest,
        ...(isPublic !== undefined && {
          isPublic: isPublic === 'true' || isPublic === true,
        }),
      };

      console.log('updateData', updateData)

      const updated = await trackService.updateTrack(
        params.id,
        user.userId,
        updateData,
      );
      return success(updated);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateTrackSchema,
      detail: {
        tags: ['Tracks'],
        summary: 'Update track',
        description: 'Update track metadata (owner only)',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, user }) => {
      const result = await trackService.deleteTrack(params.id, user.userId);
      return success(result);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Tracks'],
        summary: 'Delete track',
        description: 'Delete track and associated files (owner only)',
      },
    },
  );
