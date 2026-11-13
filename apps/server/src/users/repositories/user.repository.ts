import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { User } from '../../generated/prisma/client';
import type { MfaMethod, UserRole } from '../../generated/prisma/enums';
import { CreateOwnerInput } from '../interfaces/user.interfaces';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  updateProfile(id: string, data: { name?: string; email?: string }): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  listAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  }

  updateRole(id: string, role: UserRole): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  count(): Promise<number> {
    return this.prisma.user.count();
  }

  createFirstOwner(input: CreateOwnerInput): Promise<User | null> {
    return this.prisma.$transaction(
      async (tx) => {
        if ((await tx.user.count()) > 0) {
          return null;
        }
        return tx.user.create({ data: { ...input, role: 'OWNER' } });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async registerFailedLogin(id: string, lockUntil: Date | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { failedLoginCount: { increment: 1 }, lockedUntil: lockUntil },
    });
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  async setPendingTotpSecret(id: string, encryptedSecret: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { totpPendingSecretEnc: encryptedSecret },
    });
  }

  async activateTotp(id: string, encryptedSecret: string, methods: MfaMethod[]): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        totpSecretEnc: encryptedSecret,
        totpPendingSecretEnc: null,
        mfaMethods: methods,
      },
    });
  }

  async disableTotp(id: string, methods: MfaMethod[]): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { totpSecretEnc: null, totpPendingSecretEnc: null, mfaMethods: methods },
    });
  }

  async setMfaMethods(id: string, methods: MfaMethod[]): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { mfaMethods: methods } });
  }
}
