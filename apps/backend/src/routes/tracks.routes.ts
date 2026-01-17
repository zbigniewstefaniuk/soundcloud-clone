import { Elysia, t } from 'elysia';
import { jwtPlugin, authMiddleware } from '../middleware/auth';
import { trackService } from '../services/track.service';
import { success, paginated } from '../utils/response';
import {
  UpdateTrackSchema,
  TrackQuerySchema,
} from '../utils/validation';

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
    async ({ params, set }) => {
      const track = await trackService.getTrackById(params.id);
      await trackService.incrementPlayCount(params.id);

      const file = Bun.file(track.audioUrl);
      set.headers['Content-Type'] = track.mimeType;
      set.headers['Content-Length'] = track.fileSize.toString();
      set.headers['Accept-Ranges'] = 'bytes';

      return file;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Tracks'],
        summary: 'Stream track',
        description: 'Stream audio file',
      },
    },
  )
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, user }) => {
      const { file, title, description, genre, mainArtist, isPublic } =
        body as any;

      console.log('body', body);

      if (!file || !(file instanceof File)) {
        throw new Error('Audio file is required');
      }

      const track = await trackService.uploadTrack(file, user.userId, {
        title: title || file.name,
        description,
        genre,
        mainArtist,
        isPublic: isPublic === 'true' || isPublic === true,
      });

      return success(track);
    },
    {
      type: 'multipart/form-data',
      detail: {
        tags: ['Tracks'],
        summary: 'Upload track',
        description: 'Upload a new music track',
      },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) => {
      const updated = await trackService.updateTrack(
        params.id,
        user.userId,
        body,
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
