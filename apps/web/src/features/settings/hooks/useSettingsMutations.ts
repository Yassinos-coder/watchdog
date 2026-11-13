import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/hooks/useAuthQueries';
import type { AuthSession, AuthUser } from '@/features/auth/types/auth.types';
import { settingsService } from '../services/settingsService';
import type { ChangeEmailInput, ChangePasswordInput } from '../types/settings.types';
import { settingsKeys } from './useSettingsQueries';

function useUserWriter() {
  const queryClient = useQueryClient();
  return (user: AuthUser): void => {
    queryClient.setQueryData<AuthSession | null>(authKeys.session, (current) =>
      current ? { ...current, user } : current,
    );
  };
}

export function useUpdateName() {
  const writeUser = useUserWriter();
  return useMutation({
    mutationFn: (name: string) => settingsService.updateName(name),
    onSuccess: writeUser,
  });
}

export function useChangeEmail() {
  const writeUser = useUserWriter();
  return useMutation({
    mutationFn: (input: ChangeEmailInput) => settingsService.changeEmail(input),
    onSuccess: writeUser,
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => settingsService.changePassword(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.sessions }),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => settingsService.revokeSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.sessions }),
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => settingsService.revokeOtherSessions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.sessions }),
  });
}
