import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import openapi from '@elysiajs/openapi';
import { env, validateEnv } from './config/env';
import { testConnection } from './config/database';
import { fileService } from './services/file.service';
import { errorHandler } from './middleware/error';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/users.routes';
import { likeRoutes } from './routes/likes.routes';
import { commentRoutes } from './routes/comments.routes';
import { trackRoutes } from './routes/tracks.routes';
import { Logestic } from 'logestic';

try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

await fileService.initializeDirectories();
console.log('✅ Upload directories initialized');

const dbConnected = await testConnection();
if (!dbConnected) {
  console.error('Failed to connect to database. Exiting...');
  process.exit(1);
}

const app = new Elysia()
  .use(
    openapi({
      documentation: {
        info: {
          title: 'Elysia Music API',
          version: '1.0.0',
          description:
            'A SoundCloud-like music streaming backend built with Elysia.js',
        },
        tags: [
          { name: 'Auth', description: 'Authentication endpoints' },
          { name: 'Users', description: 'User management endpoints' },
          { name: 'Tracks', description: 'Music track endpoints' },
          { name: 'Likes', description: 'Track likes/favorites endpoints' },
          { name: 'Comments', description: 'Track comments endpoints' },
        ],
      },
    }),
  )
  .use(cors())
  .use(
    staticPlugin({
      assets: 'uploads',
      prefix: '/uploads',
    })
  )
  .onError(({ error }) => {
    return errorHandler(error);
  })
  .get('/', () => ({
    message: 'Elysia Music API',
    version: '1.0.0',
    docs: '/openapi',
  }))
  .use(authRoutes)
  .use(userRoutes)
  .use(trackRoutes)
  .use(likeRoutes)
  .use(commentRoutes);

// this type is shared with the client
export type App = typeof app;

app.listen(env.PORT); 

console.log(
  `🦊 Elysia Music API is running at ${app.server?.hostname}:${app.server?.port}`,
);
console.log(`📚 API Documentation: http://localhost:${env.PORT}/openapi`);
