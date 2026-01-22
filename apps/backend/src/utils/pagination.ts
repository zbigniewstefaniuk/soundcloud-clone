import { PAGINATION_DEFAULTS } from '../config/constants'

export interface PaginationInput {
  page?: number
  pageSize?: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
}

export function calculatePagination(input: PaginationInput) {
  const page = input.page || PAGINATION_DEFAULTS.page
  const pageSize = Math.min(
    input.pageSize || PAGINATION_DEFAULTS.pageSize,
    PAGINATION_DEFAULTS.maxPageSize,
  )
  const offset = (page - 1) * pageSize

  return { page, pageSize, offset }
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationMeta
}

export function paginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    data,
    pagination: { page, pageSize, total },
  }
}

export function emptyPaginatedResult<T>(page: number, pageSize: number) {
  return {
    data: [] as T[],
    pagination: { page, pageSize, total: 0 },
  }
}
