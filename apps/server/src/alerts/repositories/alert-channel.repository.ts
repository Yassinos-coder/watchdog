import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AlertChannel } from '../../generated/prisma/client';
import type { AlertChannelType } from '../../generated/prisma/enums';

interface CreateChannelInput {
  type: AlertChannelType;
  name: string;
  configEnc: string;
  hint: string;
}

interface UpdateChannelInput {
  name?: string;
  enabled?: boolean;
  configEnc?: string;
  hint?: string;
}

@Injectable()
export class AlertChannelRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<AlertChannel[]> {
    return this.prisma.alertChannel.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findById(id: string): Promise<AlertChannel | null> {
    return this.prisma.alertChannel.findUnique({ where: { id } });
  }

  findManyByIds(ids: string[]): Promise<AlertChannel[]> {
    return this.prisma.alertChannel.findMany({ where: { id: { in: ids } } });
  }

  count(): Promise<number> {
    return this.prisma.alertChannel.count();
  }

  create(input: CreateChannelInput): Promise<AlertChannel> {
    return this.prisma.alertChannel.create({ data: input });
  }

  update(id: string, input: UpdateChannelInput): Promise<AlertChannel> {
    return this.prisma.alertChannel.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.alertChannel.delete({ where: { id } });
  }
}
