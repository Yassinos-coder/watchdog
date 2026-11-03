import type { Invite, User } from '../../generated/prisma/client';
import type { InvitePreview, InviteView, TeamMemberView } from '../interfaces/team.interfaces';

type InviteWithInviter = Invite & { invitedBy: Pick<User, 'name'> | null };

export class TeamMapper {
  static toMember(user: User): TeamMemberView {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaEnabled: user.mfaMethods.length > 0,
      createdAt: user.createdAt.toISOString(),
    };
  }

  static toInvite(invite: InviteWithInviter): InviteView {
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      invitedByName: invite.invitedBy?.name ?? null,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
    };
  }

  static toPreview(invite: InviteWithInviter): InvitePreview {
    return { email: invite.email, role: invite.role, invitedByName: invite.invitedBy?.name ?? null };
  }
}
