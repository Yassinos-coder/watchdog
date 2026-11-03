import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { MetricInput, MetricNameView } from '../interfaces/performance.interfaces';

@Injectable()
export class MetricRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listNames(projectId: string): Promise<MetricNameView[]> {
    const groups = await this.prisma.metric.groupBy({
      by: ['name', 'type', 'unit'],
      where: { projectId },
      _count: { _all: true },
      orderBy: { name: 'asc' },
      take: 500,
    });
    return groups.map((group) => ({
      name: group.name,
      type: group.type,
      unit: group.unit,
      samples: group._count._all,
    }));
  }

  async insertMany(projectId: string, metrics: MetricInput[]): Promise<number> {
    if (metrics.length === 0) {
      return 0;
    }
    const result = await this.prisma.metric.createMany({
      data: metrics.map((metric) => ({
        projectId,
        name: metric.name,
        type: metric.type,
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags,
        release: metric.release,
        environment: metric.environment,
        timestamp: metric.timestamp,
      })),
    });
    return result.count;
  }
}
