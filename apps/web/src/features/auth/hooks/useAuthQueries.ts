import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { AuthSession } from '../types/auth.types';

export const authKeys = {
  status: ['auth', 'status'] as const,
  session: ['auth', 'session'] as const,
  security: ['auth', 'security'] as const,
};

export function useAuthStatus() {
  return useQuery({ queryKey: authKeys.status, queryFn: () => authService.getStatus() });
}

export function useOAuthProviders() {
  return useQuery({ queryKey: ['auth', 'oauth-providers'], queryFn: () => authService.getOAuthProviders() });
}

export function useAuthSession() {
  return useQuery<AuthSession | null>({
    queryKey: authKeys.session,
    queryFn: async () => {
      const session = await authService.getSession();
      return session.user || session.mfaRequired ? session : null;
    },
    staleTime: 60_000,
  });
}

export function useSecuritySummary() {
  return useQuery({ queryKey: authKeys.security, queryFn: () => authService.getSecuritySummary() });
}
