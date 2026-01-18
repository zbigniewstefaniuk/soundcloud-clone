import { api } from './client'

export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

function handleError(error: unknown): never {
  if (error && typeof error === 'object' && 'value' in error) {
    const errorValue = (error as { value: { error?: { code: string; message: string } } }).value
    if (errorValue?.error?.code && errorValue?.error?.message) {
      throw new ApiError(errorValue.error.code, errorValue.error.message)
    }
  }
  throw new ApiError('UNKNOWN_ERROR', 'An unexpected error occurred')
}

export async function register(data: { username: string; email: string; password: string }) {
  const { data: response, error } = await api.auth.register.post(data)

  if (error) {
    handleError(error)
  }

  return response!
}

export async function login(data: { email: string; password: string }) {
  const { data: response, error } = await api.auth.login.post(data)

  if (error) {
    handleError(error)
  }

  return response!
}

export async function getCurrentUser() {
  const { data: response, error } = await api.auth.me.get()

  if (error) {
    handleError(error)
  }

  return response!.data
}

export async function getUserById(id: string) {
  const { data: response, error } = await api.users({ id }).get()

  if (error) {
    handleError(error)
  }

  return response!.data
}
