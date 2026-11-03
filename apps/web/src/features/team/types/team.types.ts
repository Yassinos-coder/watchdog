import type { UserRole } from '@/features/auth/types/auth.types';

export type InvitableRole = 'ADMIN' | 'MEMBER';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  invitedByName: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface CreatedInvite {
  invite: Invite;
  link: string;
  emailSent: boolean;
}

export interface InvitePreview {
  email: string;
  role: UserRole;
  invitedByName: string | null;
}

export interface AcceptInviteInput {
  token: string;
  name: string;
  password: string;
}
