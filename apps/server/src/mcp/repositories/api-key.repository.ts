import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { ApiKey } from '../../generated/prisma/client';

interface CreateKeyInput {
  name: string;
  prefix: string;
  keyHash: string;
  permissions: string[];
  createdById: string;
}

@Injectable()
export class ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({ where: { id } });
  }

  findByHash(keyHash: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({ where: { keyHash } });
  }

  count(): Promise<number> {
    return this.prisma.apiKey.count();
  }

  create(input: CreateKeyInput): Promise<ApiKey> {
    return this.prisma.apiKey.create({ data: input });
  }

  update(id: string, data: { name?: string; permissions?: string[] }): Promise<ApiKey> {
    return this.prisma.apiKey.update({ where: { id }, data });
  }

  async touch(id: string): Promise<void> {
    await this.prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.apiKey.delete({ where: { id } });
  }
}
