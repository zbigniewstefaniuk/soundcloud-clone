import { apiClient } from './client'

export interface RegisterInput {
  username: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface User {
  id: string
  username: string
  email: string
}

export interface AuthResponse {
  success: boolean
  data: {
    token: string
    user: User
  }
}

export interface ApiError {
  code: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

export class AuthError extends Error {
  code: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'AuthError'
    this.code = error.code
  }
}

export async function register(data: RegisterInput): Promise<AuthResponse> {
  const { data: response, error } = await apiClient.POST('/auth/register', {
    body: data,
  })

  if (error) {
    const errorData = error as unknown as ApiErrorResponse
    if (errorData?.error?.code && errorData?.error?.message) {
      throw new AuthError(errorData.error)
    }
    throw new Error('Registration failed')
  }

  if (!response) {
    throw new Error('Registration failed')
  }

  return response as AuthResponse
}

export async function login(data: LoginInput): Promise<AuthResponse> {
  const { data: response, error } = await apiClient.POST('/auth/login', {
    body: data,
  })

  if (error) {
    const errorData = error as unknown as ApiErrorResponse
    if (errorData?.error?.code && errorData?.error?.message) {
      throw new AuthError(errorData.error)
    }
    throw new Error('Login failed')
  }

  if (!response) {
    throw new Error('Login failed')
  }

  return response as AuthResponse
}

export async function getCurrentUser(): Promise<User> {
  const { data: response, error } = await apiClient.GET('/auth/me')

  if (error) {
    const errorData = error as unknown as ApiErrorResponse
    if (errorData?.error?.code && errorData?.error?.message) {
      throw new AuthError(errorData.error)
    }
    throw new Error('Failed to fetch current user')
  }

  if (!response) {
    throw new Error('Failed to fetch current user')
  }

  return (response as any).data as User
}

export async function getUserById(id: string): Promise<User> {
  const { data: response, error } = await apiClient.GET('/users/{id}', {
    params: {
      path: { id },
    },
  })

  if (error) {
    const errorData = error as unknown as ApiErrorResponse
    if (errorData?.error?.code && errorData?.error?.message) {
      throw new AuthError(errorData.error)
    }
    throw new Error('Failed to fetch user')
  }

  if (!response) {
    throw new Error('Failed to fetch user')
  }

  return (response as any).data as User
}
