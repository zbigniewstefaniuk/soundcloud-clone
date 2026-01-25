import { Elysia } from 'elysia'
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth'
import { trackService } from '../services/track.service'
import { streamTokenService } from '../services/stream-token.service'
import { success, paginated } from '../utils/response'
import {
  CreateTrackSchema,
  TrackQuerySchema,
  UpdateTrackSchema,
  parseBooleanOrString,
} from '../utils/validation'
import { IdParamSchema } from '../utils/schemas'
import {
  InvalidStreamTokenError,
  StreamTokenMismatchError,
  StreamTokenRequiredError,
  FileNotFoundOnServerError,
} from '../middleware/error'

export const trackRoutes = new Elysia({ prefix: '/tracks' })
  // Public routes with optional auth (for visibility of private tracks to owners)
  .use(optionalAuthMiddleware)
  .get(
    '/',
    async ({ query, currentUserId }) => {
      const result = await trackService.getTracks(query, currentUserId)
      return paginated(result.data, result.pagination)
    },
    {
      query: TrackQuerySchema,
      detail: {
        tags: ['Tracks'],
        summary: 'List tracks',
        description: 'Get paginated list of tracks. Private tracks only visible to owner.',
      },
    },
  )
  .get(
    '/:id',
    async ({ params, currentUserId }) => {
      const track = await trackService.getTrackById(params.id, currentUserId)
      return success(track)
    },
    {
      params: IdParamSchema,
      detail: {
        tags: ['Tracks'],
        summary: 'Get track',
        description: 'Get track by ID. Private tracks only visible to owner.',
      },
    },
  )
  .get(
    '/:id/stream-token',
    async ({ params, currentUserId }) => {
      // Verify access (throws if private and not owner)
      await trackService.getTrackById(params.id, currentUserId)

      const streamToken = streamTokenService.generateStreamToken(params.id, currentUserId)

      return success({
        streamUrl: `/tracks/${params.id}/stream?st=${streamToken}`,
        expiresIn: 3600,
      })
    },
    {
      params: IdParamSchema,
      detail: {
        tags: ['Tracks'],
        summary: 'Get streaming token',
        description: 'Generate signed URL for streaming (1 hour)',
      },
    },
  )
  .get(
    '/:id/stream',
    async ({ params, set, request }) => {
      const url = new URL(request.url)
      const streamToken = url.searchParams.get('st')

      let track

      if (streamToken) {
        const tokenData = streamTokenService.verifyStreamToken(streamToken)

        if (!tokenData) {
          throw new InvalidStreamTokenError()
        }

        if (tokenData.trackId !== params.id) {
          throw new StreamTokenMismatchError()
        }

        track = await trackService.getTrackById(params.id, tokenData.userId)
      } else {
        // No token - only public tracks allowed
        track = await trackService.getTrackById(params.id)
        if (!track.isPublic) {
          throw new StreamTokenRequiredError()
        }
      }

      const file = Bun.file(track.audioUrl)
      if (!(await file.exists())) {
        throw new FileNotFoundOnServerError()
      }

      await trackService.incrementPlayCount(params.id)

      const fileSize = file.size
      const rangeHeader = request.headers.get('range')

      set.headers['Accept-Ranges'] = 'bytes'
      set.headers['Content-Type'] = track.mimeType

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
        if (match) {
          const start = match[1] ? parseInt(match[1], 10) : 0
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
          const chunkSize = end - start + 1

          set.status = 206
          set.headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`
          set.headers['Content-Length'] = chunkSize.toString()

          return file.slice(start, end + 1)
        }
      }

      set.headers['Content-Length'] = fileSize.toString()
      return file
    },
    {
      params: IdParamSchema,
      detail: {
        tags: ['Tracks'],
        summary: 'Stream track',
        description: 'Stream audio. Use ?st= with token from /stream-token.',
      },
    },
  )
  // Protected routes - require authentication
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, user }) => {
      const { file, title, description, genre, isPublic, coverArt, collaboratorIds } = body

      if (!file || !(file instanceof File)) {
        throw new Error('Audio file is required')
      }

      const track = await trackService.uploadTrack({
        userId: user.userId,
        input: {
          title,
          description,
          genre,
          isPublic,
          file,
          coverArt,
          collaboratorIds,
        },
      })

      return success(track)
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
    async ({ params, body, user }) => {
      const { isPublic, ...rest } = body

      const updateData = {
        ...rest,
        ...(isPublic !== undefined && {
          isPublic: parseBooleanOrString(isPublic),
        }),
      }

      const updated = await trackService.updateTrack(params.id, user.userId, updateData)
      return success(updated)
    },
    {
      params: IdParamSchema,
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
      const result = await trackService.deleteTrack(params.id, user.userId)
      return success(result)
    },
    {
      params: IdParamSchema,
      detail: {
        tags: ['Tracks'],
        summary: 'Delete track',
        description: 'Delete track and files (owner only)',
      },
    },
  )
