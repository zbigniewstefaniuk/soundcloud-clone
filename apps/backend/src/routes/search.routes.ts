import { Elysia, t } from 'elysia'
import { searchService } from '../services/search.service'
import { success } from '../utils/response'

export const searchRoutes = new Elysia({ prefix: '/search' })
  .get(
    '/tracks',
    async ({ query }) => {
      const results = await searchService.hybridSearch({
        query: query.q,
        limit: query.limit,
        threshold: query.threshold,
      })
      return success(results)
    },
    {
      query: t.Object({
        q: t.String({ minLength: 1, maxLength: 200 }),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 50, default: 20 })),
        threshold: t.Optional(t.Number({ minimum: 0, maximum: 1, default: 0.3 })),
      }),
      detail: {
        tags: ['Search'],
        summary: 'Search tracks',
        description:
          'Semantic search for public tracks using vector similarity. Returns tracks ranked by relevance.',
      },
    },
  )
  .get(
    '/users',
    async ({ query }) => {
      const results = await searchService.searchUsers({
        query: query.q,
        limit: query.limit,
      })
      return success(results)
    },
    {
      query: t.Object({
        q: t.String({ minLength: 1, maxLength: 100 }),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 20, default: 10 })),
      }),
      detail: {
        tags: ['Search'],
        summary: 'Search users',
        description: 'Search users by username or display name.',
      },
    },
  )
