import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Invite, User } from '../../generated/prisma/client';
import type { AcceptInviteInput, CreateInviteInput } from '../interfaces/team.interfaces';

type InviteWithInviter = Invite & { invitedBy: Pick<User, 'name'> | null };

const INCLUDE_INVITER = { invitedBy: { select: { name: true } } } as const;

@Injectable()
export class InviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPending(now: Date): Promise<InviteWithInviter[]> {
    return this.prisma.invite.findMany({
      where: { acceptedAt: null, expiresAt: { gt: now } },
      include: INCLUDE_INVITER,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<Invite | null> {
    return this.prisma.invite.findUnique({ where: { id } });
  }

  findPendingByTokenHash(tokenHash: string, now: Date): Promise<InviteWithInviter | null> {
    return this.prisma.invite.findFirst({
      where: { tokenHash, acceptedAt: null, expiresAt: { gt: now } },
      include: INCLUDE_INVITER,
    });
  }

  findPendingByEmail(email: string, now: Date): Promise<Invite | null> {
    return this.prisma.invite.findFirst({
      where: { email, acceptedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replaceForEmail(input: CreateInviteInput): Promise<InviteWithInviter> {
    const [, created] = await this.prisma.$transaction([
      this.prisma.invite.deleteMany({ where: { email: input.email, acceptedAt: null } }),
      this.prisma.invite.create({ data: input, include: INCLUDE_INVITER }),
    ]);
    return created;
  }

  async accept(input: AcceptInviteInput): Promise<User | null> {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.invite.updateMany({
        where: { id: input.inviteId, acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
      if (claimed.count === 0) {
        return null;
      }
      return tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          passwordHash: input.passwordHash,
        },
      });
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.invite.delete({ where: { id } });
  }
}
