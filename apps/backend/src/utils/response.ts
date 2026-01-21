// Standardized response helpers

export interface SuccessResponse<T> {
  success: true
  data: T
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function success<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  }
}

export function error(code: string, message: string, details?: any): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}

export function paginated<T>(
  data: T[],
  pagination: {
    page: number
    pageSize: number
    total: number
  },
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.pageSize),
    },
  }
}
