import { Elysia, t } from 'elysia'
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth'
import { trackService } from '../services/track.service'
import { streamTokenService } from '../services/stream-token.service'
import { success, paginated } from '../utils/response'
import { CreateTrackSchema, TrackQuerySchema, UpdateTrackSchema } from '../utils/validation'

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
      params: t.Object({ id: t.String() }),
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
        expiresIn: 300,
      })
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ['Tracks'],
        summary: 'Get streaming token',
        description: 'Generate short-lived signed URL for streaming (5 min)',
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
          set.status = 401
          return {
            success: false,
            error: {
              code: 'INVALID_STREAM_TOKEN',
              message: 'Invalid or expired stream token',
            },
          }
        }

        if (tokenData.trackId !== params.id) {
          set.status = 403
          return {
            success: false,
            error: {
              code: 'TOKEN_TRACK_MISMATCH',
              message: 'Stream token not valid for this track',
            },
          }
        }

        track = await trackService.getTrackById(params.id, tokenData.userId)
      } else {
        // No token - only public tracks allowed
        track = await trackService.getTrackById(params.id)
        if (!track.isPublic) {
          set.status = 401
          return {
            success: false,
            error: {
              code: 'STREAM_TOKEN_REQUIRED',
              message: 'Stream token required for private tracks',
            },
          }
        }
      }

      const file = Bun.file(track.audioUrl)
      if (!(await file.exists())) {
        set.status = 404
        return {
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'Audio file not found on server',
          },
        }
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
      params: t.Object({ id: t.String() }),
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
      const { file, title, description, genre, mainArtist, isPublic, coverArt } = body

      if (!file || !(file instanceof File)) {
        throw new Error('Audio file is required')
      }

      const track = await trackService.uploadTrack({
        userId: user.userId,
        input: {
          ...body,
          title,
          description,
          genre,
          mainArtist,
          isPublic,
          file,
          coverArt,
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
          isPublic: isPublic === 'true' || isPublic === true,
        }),
      }

      const updated = await trackService.updateTrack(params.id, user.userId, updateData)
      return success(updated)
    },
    {
      params: t.Object({ id: t.String() }),
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
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ['Tracks'],
        summary: 'Delete track',
        description: 'Delete track and files (owner only)',
      },
    },
  )
