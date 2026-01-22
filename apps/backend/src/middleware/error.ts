// Custom error classes

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details)
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'AUTH_ERROR', message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message)
  }
}

// Streaming-specific errors
export class InvalidStreamTokenError extends AppError {
  constructor() {
    super(401, 'INVALID_STREAM_TOKEN', 'Invalid or expired stream token')
  }
}

export class StreamTokenMismatchError extends AppError {
  constructor() {
    super(403, 'TOKEN_TRACK_MISMATCH', 'Stream token not valid for this track')
  }
}

export class StreamTokenRequiredError extends AppError {
  constructor() {
    super(401, 'STREAM_TOKEN_REQUIRED', 'Stream token required for private tracks')
  }
}

export class FileNotFoundOnServerError extends AppError {
  constructor() {
    super(404, 'FILE_NOT_FOUND', 'Audio file not found on server')
  }
}

// Parse validation error object
function parseValidationError(errorData: any) {
  // Try to parse if it's a string
  let validationObj = errorData
  if (typeof errorData === 'string') {
    try {
      validationObj = JSON.parse(errorData)
    } catch {
      return { property: 'field', message: 'Validation failed' }
    }
  }

  const property = (validationObj.property || '').replace('/', '') || 'field'
  const firstError = validationObj.errors?.[0]
  const summary = validationObj.summary || validationObj.message || ''

  // Extract meaningful message
  if (summary.includes('length greater or equal to')) {
    const minLength = firstError?.schema?.minLength
    return {
      property,
      message: `${property} must be at least ${minLength} characters`,
    }
  }

  if (summary.includes('length less or equal to')) {
    const maxLength = firstError?.schema?.maxLength
    return {
      property,
      message: `${property} must be no more than ${maxLength} characters`,
    }
  }

  if (summary.includes('format') || summary.includes('email')) {
    return { property, message: `Invalid ${property} format` }
  }

  if (summary.includes('Required') || summary.includes('Expected string')) {
    return { property, message: `${property} is required` }
  }

  return { property, message: summary || 'Validation failed' }
}

type ErrorHandlerContext = {
  set: { status?: number | string }
}

type ErrorWithMessage = { message: string }
type ErrorWithType = { type: string }
type ErrorWithCode = { code: string }

function hasMessage(error: unknown): error is ErrorWithMessage {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as ErrorWithMessage).message === 'string'
}

function hasType(error: unknown): error is ErrorWithType {
  return typeof error === 'object' && error !== null && 'type' in error
}

function hasCode(error: unknown): error is ErrorWithCode {
  return typeof error === 'object' && error !== null && 'code' in error
}

// Global error handler
export function errorHandler(error: unknown, { set }: ErrorHandlerContext) {
  // Handle AppError instances (must check first - sets proper status code)
  if (error instanceof AppError) {
    set.status = error.statusCode
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    }
  }

  // Parse validation errors from stringified format
  if (hasMessage(error) && error.message.includes('"type":"validation"')) {
    set.status = 400
    const { message } = parseValidationError(error.message)
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    }
  }

  // Handle Elysia validation errors (object format)
  if (hasType(error) && error.type === 'validation') {
    set.status = 400
    const { message } = parseValidationError(error)
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    }
  }

  // Handle 404
  if (hasCode(error) && error.code === 'NOT_FOUND') {
    set.status = 404
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    }
  }

  // Default error
  set.status = 500
  console.error('Unhandled error:', error)
  return {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Something went wrong',
    },
  }
}
