import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { register, login, getCurrentUser } from '../api/auth';
import { setToken, removeToken, getToken } from '../lib/auth-storage';

const USER_QUERY_KEY = ['current-user'];

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setToken(data.data.token);
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      navigate({ to: '/' });
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.data.token);
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      navigate({ to: '/' });
    },
  });
}

export function useCurrentUser() {
  const token = getToken();

  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getCurrentUser,
    enabled: !!token,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    removeToken();
    queryClient.clear();
    navigate({ to: '/' });
  };
}
