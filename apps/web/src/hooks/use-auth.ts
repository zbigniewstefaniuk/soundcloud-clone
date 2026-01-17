import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { register, login, getCurrentUser, getUserById, type User, type RegisterInput, type LoginInput, AuthError } from '../api/auth';
import { authStorage } from '../lib/auth-storage';
import { useCallback, useMemo } from 'react';

const USER_QUERY_KEY = ['current-user'] as const;


export function useAccount() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = authStorage.token.get();

  const query = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getCurrentUser,
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = useCallback(() => {
    authStorage.clear();
    queryClient.clear();
    navigate({ to: '/auth/login' });
  }, [queryClient, navigate]);

  return useMemo(() => ({
    // User data
    user: query.data ?? null,

    // Authentication state
    isAuthenticated: !!query.data && !!token,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Actions
    logout,
    refetch: query.refetch,
  }), [query.data, query.isLoading, query.isError, query.error, token, logout, query.refetch]);
}


export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterInput) => register(data),
    onSuccess: (data) => {
      authStorage.setAuth(data.data.token, data.data.user);
      queryClient.setQueryData(USER_QUERY_KEY, data.data.user);
      navigate({ to: '/' });
    },
  });
}


export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginInput) => login(data),
    onSuccess: (data) => {
      authStorage.setAuth(data.data.token, data.data.user);
      queryClient.setQueryData(USER_QUERY_KEY, data.data.user);
      navigate({ to: '/' });
    },
  });
}



export function useUserProfile(userId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['user', userId] as const,
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  return useMemo(() => ({
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }), [query.data, query.isLoading, query.isError, query.error, query.refetch]);
}
