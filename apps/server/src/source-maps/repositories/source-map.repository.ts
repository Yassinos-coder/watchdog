import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Release, SourceMap } from '../../generated/prisma/client';
import { ReleaseView } from '../interfaces/source-map.interfaces';

@Injectable()
export class SourceMapRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRelease(projectId: string, version: string): Promise<Release | null> {
    return this.prisma.release.findUnique({
      where: { projectId_version: { projectId, version } },
    });
  }

  ensureRelease(projectId: string, version: string): Promise<Release> {
    return this.prisma.release.upsert({
      where: { projectId_version: { projectId, version } },
      create: { projectId, version },
      update: {},
    });
  }

  async listReleases(projectId: string): Promise<ReleaseView[]> {
    const releases = await this.prisma.release.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { _count: { select: { sourceMaps: true } } },
    });
    return releases.map((release) => ({
      id: release.id,
      version: release.version,
      createdAt: release.createdAt,
      sourceMapCount: release._count.sourceMaps,
    }));
  }

  async save(releaseId: string, filePath: string, content: Buffer): Promise<void> {
    const data = new Uint8Array(content);
    await this.prisma.sourceMap.upsert({
      where: { releaseId_filePath: { releaseId, filePath } },
      create: { releaseId, filePath, content: data, size: content.length },
      update: { content: data, size: content.length },
    });
  }

  findByPaths(releaseId: string, filePaths: string[]): Promise<SourceMap[]> {
    return this.prisma.sourceMap.findMany({ where: { releaseId, filePath: { in: filePaths } } });
  }
}
