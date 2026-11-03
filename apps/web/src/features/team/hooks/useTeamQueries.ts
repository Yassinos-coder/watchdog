import { useQuery } from '@tanstack/react-query';
import { teamService } from '../services/teamService';

export const teamKeys = {
  members: ['team', 'members'] as const,
  invites: ['team', 'invites'] as const,
  preview: (token: string) => ['team', 'preview', token] as const,
};

export function useTeamMembers() {
  return useQuery({ queryKey: teamKeys.members, queryFn: () => teamService.listMembers() });
}

export function useInvites() {
  return useQuery({ queryKey: teamKeys.invites, queryFn: () => teamService.listInvites() });
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: teamKeys.preview(token),
    queryFn: () => teamService.previewInvite(token),
    retry: false,
  });
}
