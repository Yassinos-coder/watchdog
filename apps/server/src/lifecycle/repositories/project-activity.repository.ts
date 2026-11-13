import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ACTIVITY_LOOKBACK_MS, MAX_PROJECTS_QUERIED } from '../constants/lifecycle.constants';
import { ProjectActivity } from '../interfaces/lifecycle.interfaces';

@Injectable()
export class ProjectActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(now = Date.now()): Promise<ProjectActivity[]> {
    const where = { timestamp: { gte: new Date(now - ACTIVITY_LOOKBACK_MS) } };
    const [projects, events, transactions, metrics] = await Promise.all([
      this.prisma.project.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
        take: MAX_PROJECTS_QUERIED,
      }),
      this.prisma.event.groupBy({ by: ['projectId'], where, _max: { timestamp: true } }),
      this.prisma.transaction.groupBy({ by: ['projectId'], where, _max: { timestamp: true } }),
      this.prisma.metric.groupBy({ by: ['projectId'], where, _max: { timestamp: true } }),
    ]);
    const latest = new Map<string, Date>();
    for (const group of [...events, ...transactions, ...metrics]) {
      const seen = group._max.timestamp;
      const known = latest.get(group.projectId);
      if (seen && (!known || seen > known)) {
        latest.set(group.projectId, seen);
      }
    }
    return projects.map((project) => ({
      name: project.name,
      lastSeen: latest.get(project.id) ?? null,
    }));
  }
}
