import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SessionMeta, SessionWithUser } from '../interfaces/auth.interfaces';

interface CreateSessionInput extends SessionMeta {
  userId: string;
  tokenHash: string;
  mfaPassed: boolean;
  expiresAt: Date;
}

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTokenHash(tokenHash: string): Promise<SessionWithUser | null> {
    return this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async create(input: CreateSessionInput): Promise<void> {
    await this.prisma.session.create({ data: input });
  }

  async promote(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: {
        tokenHash,
        expiresAt,
        mfaPassed: true,
        mfaAttempts: 0,
        webauthnChallenge: null,
        emailOtpHash: null,
        emailOtpExpiresAt: null,
      },
    });
  }

  async setChallenge(id: string, challenge: string | null): Promise<void> {
    await this.prisma.session.update({ where: { id }, data: { webauthnChallenge: challenge } });
  }

  async setEmailOtp(id: string, hash: string, expiresAt: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { emailOtpHash: hash, emailOtpExpiresAt: expiresAt, mfaAttempts: 0 },
    });
  }

  async clearEmailOtp(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { emailOtpHash: null, emailOtpExpiresAt: null },
    });
  }

  async incrementMfaAttempts(id: string): Promise<number> {
    const session = await this.prisma.session.update({
      where: { id },
      data: { mfaAttempts: { increment: 1 } },
      select: { mfaAttempts: true },
    });
    return session.mfaAttempts;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id } });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }
}
