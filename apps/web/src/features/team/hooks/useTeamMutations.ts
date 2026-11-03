import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authKeys } from '@/features/auth/hooks/useAuthQueries';
import type { AuthSession } from '@/features/auth/types/auth.types';
import { teamService } from '../services/teamService';
import type { AcceptInviteInput, InvitableRole } from '../types/team.types';
import { teamKeys } from './useTeamQueries';

export function useChangeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: InvitableRole }) =>
      teamService.changeRole(userId, role),
    onSuccess: () => {
      toast.success('Role updated');
      void queryClient.invalidateQueries({ queryKey: teamKeys.members });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => teamService.removeMember(userId),
    onSuccess: () => {
      toast.success('Member removed');
      void queryClient.invalidateQueries({ queryKey: teamKeys.members });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: InvitableRole }) =>
      teamService.createInvite(email, role),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: teamKeys.invites }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => teamService.revokeInvite(inviteId),
    onSuccess: () => {
      toast.success('Invite revoked');
      void queryClient.invalidateQueries({ queryKey: teamKeys.invites });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AcceptInviteInput) => teamService.acceptInvite(input),
    onSuccess: (session: AuthSession) => queryClient.setQueryData(authKeys.session, session),
  });
}
