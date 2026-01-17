// Custom error classes

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'AUTH_ERROR', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

// Parse validation error object
function parseValidationError(errorData: any) {
  // Try to parse if it's a string
  let validationObj = errorData;
  if (typeof errorData === 'string') {
    try {
      validationObj = JSON.parse(errorData);
    } catch {
      return { property: 'field', message: 'Validation failed' };
    }
  }

  const property = (validationObj.property || '').replace('/', '') || 'field';
  const firstError = validationObj.errors?.[0];
  const summary = validationObj.summary || validationObj.message || '';

  // Extract meaningful message
  if (summary.includes('length greater or equal to')) {
    const minLength = firstError?.schema?.minLength;
    return {
      property,
      message: `${property} must be at least ${minLength} characters`,
    };
  }

  if (summary.includes('length less or equal to')) {
    const maxLength = firstError?.schema?.maxLength;
    return {
      property,
      message: `${property} must be no more than ${maxLength} characters`,
    };
  }

  if (summary.includes('format') || summary.includes('email')) {
    return { property, message: `Invalid ${property} format` };
  }

  if (summary.includes('Required') || summary.includes('Expected string')) {
    return { property, message: `${property} is required` };
  }

  return { property, message: summary || 'Validation failed' };
}

// Global error handler
export function errorHandler(error: any) {
  // Parse validation errors from stringified format
  if (typeof error?.message === 'string' && error.message.includes('"type":"validation"')) {
    const { message } = parseValidationError(error.message);
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    };
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  // Handle Elysia validation errors (object format)
  if (error.type === 'validation') {
    const { message } = parseValidationError(error);
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    };
  }

  // Handle 404
  if (error.code === 'NOT_FOUND') {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    };
  }

  // Default error
  console.error('Unhandled error:', error);
  return {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Something went wrong',
    },
  };
}
