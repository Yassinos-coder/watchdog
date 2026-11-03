import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { ProjectKey } from '../../generated/prisma/client';
import { CreateProjectInput } from '../interfaces/project.interfaces';
import { ProjectWithKeys } from '../mappers/project.mapper';

const WITH_KEYS = { keys: { orderBy: { createdAt: 'asc' as const } } };

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ProjectWithKeys[]> {
    return this.prisma.project.findMany({ include: WITH_KEYS, orderBy: { createdAt: 'asc' } });
  }

  findById(id: string): Promise<ProjectWithKeys | null> {
    return this.prisma.project.findUnique({ where: { id }, include: WITH_KEYS });
  }

  async slugExists(slug: string): Promise<boolean> {
    return (await this.prisma.project.count({ where: { slug } })) > 0;
  }

  create(input: CreateProjectInput): Promise<ProjectWithKeys> {
    const { publicKey, ...project } = input;
    return this.prisma.project.create({
      data: { ...project, keys: { create: { publicKey } } },
      include: WITH_KEYS,
    });
  }

  update(id: string, data: { name?: string; platform?: string }): Promise<ProjectWithKeys> {
    return this.prisma.project.update({ where: { id }, data, include: WITH_KEYS });
  }

  async setUploadTokenHash(id: string, uploadTokenHash: string): Promise<void> {
    await this.prisma.project.update({ where: { id }, data: { uploadTokenHash } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }

  findKeyByPublicKey(publicKey: string): Promise<ProjectKey | null> {
    return this.prisma.projectKey.findUnique({ where: { publicKey } });
  }

  addKey(projectId: string, publicKey: string, label: string): Promise<ProjectKey> {
    return this.prisma.projectKey.create({ data: { projectId, publicKey, label } });
  }

  findKey(projectId: string, keyId: string): Promise<ProjectKey | null> {
    return this.prisma.projectKey.findFirst({ where: { id: keyId, projectId } });
  }

  async setKeyActive(keyId: string, active: boolean): Promise<void> {
    await this.prisma.projectKey.update({ where: { id: keyId }, data: { active } });
  }

  async deleteKey(keyId: string): Promise<void> {
    await this.prisma.projectKey.delete({ where: { id: keyId } });
  }

  countKeys(projectId: string): Promise<number> {
    return this.prisma.projectKey.count({ where: { projectId } });
  }

  async findUploadTokenHash(id: string): Promise<string | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { uploadTokenHash: true },
    });
    return project?.uploadTokenHash ?? null;
  }
}
