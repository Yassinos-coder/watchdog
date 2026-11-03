import type { UserRole } from '../../generated/prisma/enums';

export interface TeamMemberView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface InviteView {
  id: string;
  email: string;
  role: UserRole;
  invitedByName: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface CreatedInviteView {
  invite: InviteView;
  link: string;
  emailSent: boolean;
}

export interface InvitePreview {
  email: string;
  role: UserRole;
  invitedByName: string | null;
}

export interface CreateInviteInput {
  email: string;
  role: UserRole;
  tokenHash: string;
  invitedById: string;
  expiresAt: Date;
}

export interface AcceptInviteInput {
  inviteId: string;
  email: string;
  role: UserRole;
  name: string;
  passwordHash: string;
}
