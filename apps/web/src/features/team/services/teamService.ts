import type { AuthSession } from '@/features/auth/types/auth.types';
import { BaseApiClient } from '@/services/BaseApiClient';
import type {
  AcceptInviteInput,
  CreatedInvite,
  InvitableRole,
  Invite,
  InvitePreview,
  TeamMember,
} from '../types/team.types';

class TeamService extends BaseApiClient {
  listMembers(): Promise<TeamMember[]> {
    return this.get('/team');
  }

  changeRole(userId: string, role: InvitableRole): Promise<TeamMember> {
    return this.patch(`/team/${userId}`, { role });
  }

  removeMember(userId: string): Promise<void> {
    return this.delete(`/team/${userId}`);
  }

  listInvites(): Promise<Invite[]> {
    return this.get('/invites');
  }

  createInvite(email: string, role: InvitableRole): Promise<CreatedInvite> {
    return this.post('/invites', { email, role });
  }

  revokeInvite(inviteId: string): Promise<void> {
    return this.delete(`/invites/${inviteId}`);
  }

  previewInvite(token: string): Promise<InvitePreview> {
    return this.get(`/invites/preview/${encodeURIComponent(token)}`);
  }

  acceptInvite(input: AcceptInviteInput): Promise<AuthSession> {
    return this.post('/invites/accept', input);
  }
}

export const teamService = new TeamService();
