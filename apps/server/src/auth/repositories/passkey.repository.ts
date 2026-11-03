import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Passkey } from '../../generated/prisma/client';

interface CreatePasskeyInput {
  id: string;
  userId: string;
  name: string;
  publicKey: Uint8Array<ArrayBuffer>;
  counter: number;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
}

@Injectable()
export class PasskeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string): Promise<Passkey[]> {
    return this.prisma.passkey.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  findForUser(userId: string, id: string): Promise<Passkey | null> {
    return this.prisma.passkey.findFirst({ where: { id, userId } });
  }

  async create(input: CreatePasskeyInput): Promise<void> {
    await this.prisma.passkey.create({ data: { ...input, counter: BigInt(input.counter) } });
  }

  async recordUse(id: string, counter: number): Promise<void> {
    await this.prisma.passkey.update({
      where: { id },
      data: { counter: BigInt(counter), lastUsedAt: new Date() },
    });
  }
}
