// Environment variable validation and configuration

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  POSTGRES_USER: process.env.POSTGRES_USER || 'elysia_user',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'elysia_password',
  POSTGRES_DB: process.env.POSTGRES_DB || 'elysia_music_db',

  // Server
  PORT: parseInt(process.env.PORT || '8000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
}

// Validate required environment variables
export function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET']
  const missing = required.filter((key) => !env[key as keyof typeof env])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters for security')
  }
}
