import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { register, login, getCurrentUser, getUserById } from '@/api/auth'
import { authStorage } from '@/lib/auth-storage'
import { useCallback, useMemo } from 'react'

const USER_QUERY_KEY = ['current-user'] as const

export function useAccount() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const token = authStorage.token.get()

  const query = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getCurrentUser,
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  const logout = useCallback(() => {
    authStorage.clear()
    queryClient.clear()
    navigate({ to: '/auth/login' })
  }, [queryClient, navigate])

  return useMemo(
    () => ({
      user: query.data ?? null,
      isAuthenticated: !!query.data && !!token,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      logout,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isError, query.error, token, logout, query.refetch]
  )
}

export function useRegister() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (data: { username: string; email: string; password: string }) => register(data),
    onSuccess: (response) => {
      authStorage.setAuth(response.data.token, response.data.user)
      queryClient.setQueryData(USER_QUERY_KEY, response.data.user)
      navigate({ to: '/' })
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { email: string; password: string }) => login(data),
    onSuccess: (response) => {
      authStorage.setAuth(response.data.token, response.data.user)
      queryClient.setQueryData(USER_QUERY_KEY, response.data.user)
      navigate({ to: '/' })
    },
  })
}

export function useUserProfile(userId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['user', userId] as const,
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })

  return useMemo(
    () => ({
      user: query.data ?? null,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isError, query.error, query.refetch]
  )
}
