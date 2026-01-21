import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import type { ApiError } from './error'

/**
 * Extracts params and query options separately.
 * Handles optional params with defaults correctly.
 */
export type QueryOptionsWithParams<
  TQueryFn extends (...args: any[]) => Promise<any>,
  TData = Awaited<ReturnType<TQueryFn>>,
  TError = ApiError,
> =
  Parameters<TQueryFn> extends []
    ? {
        // No params
        params?: never
        options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
      }
    : Parameters<TQueryFn>[0] extends undefined
      ? {
          // Optional param
          params?: never
          options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
        }
      : {
          // Required or optional-with-default param
          params?: Parameters<TQueryFn>[0]
          options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
        }

/**
 * Combines react-query mutation options with API function params.
 * Separates mutation variables from mutation options.
 */
export type MutationOptionsWithParams<
  TQueryFn extends (...args: any[]) => Promise<any>,
  TData = Awaited<ReturnType<TQueryFn>>,
  TError = ApiError,
  TContext = unknown,
> = Omit<UseMutationOptions<TData, TError, Parameters<TQueryFn>[0], TContext>, 'mutationFn'>
