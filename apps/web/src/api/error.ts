export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export function handleError(error: unknown): never {
  if (error && typeof error === 'object' && 'value' in error) {
    const errorValue = (error as { value: { error?: { code: string; message: string } } }).value
    if (errorValue?.error?.code && errorValue?.error?.message) {
      throw new ApiError(errorValue.error.code, errorValue.error.message)
    }
  }
  throw new ApiError('UNKNOWN_ERROR', 'An unexpected error occurred')
}
