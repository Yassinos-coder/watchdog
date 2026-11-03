import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Event, Issue, Prisma } from '../../generated/prisma/client';
import type { IssueStatus } from '../../generated/prisma/enums';
import { IssueListFilter, IssueSort, StatsBucket, StatsRange } from '../interfaces/issue.interfaces';

const ORDER_BY: Record<IssueSort, Prisma.IssueOrderByWithRelationInput> = {
  lastSeen: { lastSeen: 'desc' },
  firstSeen: { firstSeen: 'desc' },
  events: { eventCount: 'desc' },
};

const RANGE_HOURS: Record<StatsRange, number> = { '24h': 24, '7d': 168, '30d': 720 };
const RANGE_BUCKET: Record<StatsRange, 'hour' | 'day'> = { '24h': 'hour', '7d': 'day', '30d': 'day' };

@Injectable()
export class IssueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: IssueListFilter): Promise<{ items: Issue[]; total: number }> {
    const where: Prisma.IssueWhereInput = {
      projectId: filter.projectId,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.query
        ? {
            OR: [
              { title: { contains: filter.query, mode: 'insensitive' } },
              { culprit: { contains: filter.query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.issue.findMany({
        where,
        orderBy: ORDER_BY[filter.sort],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.issue.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string): Promise<Issue | null> {
    return this.prisma.issue.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: IssueStatus): Promise<Issue> {
    return this.prisma.issue.update({
      where: { id },
      data: { status, ...(status === 'RESOLVED' ? { regressedAt: null } : {}) },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.issue.delete({ where: { id } });
  }

  findLatestEvent(issueId: string): Promise<Event | null> {
    return this.prisma.event.findFirst({ where: { issueId }, orderBy: { timestamp: 'desc' } });
  }

  async listEvents(
    issueId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: Event[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where: { issueId },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.event.count({ where: { issueId } }),
    ]);
    return { items, total };
  }

  findEvent(id: string): Promise<Event | null> {
    return this.prisma.event.findUnique({ where: { id } });
  }

  async countUnresolved(projectId: string): Promise<number> {
    return this.prisma.issue.count({ where: { projectId, status: 'UNRESOLVED' } });
  }

  countNewIssues(projectId: string, since: Date): Promise<number> {
    return this.prisma.issue.count({ where: { projectId, firstSeen: { gte: since } } });
  }

  countEvents(projectId: string, since: Date): Promise<number> {
    return this.prisma.event.count({ where: { projectId, timestamp: { gte: since } } });
  }

  async eventSeries(projectId: string, range: StatsRange): Promise<StatsBucket[]> {
    const since = this.rangeStart(range);
    const unit = RANGE_BUCKET[range];
    const rows = await this.prisma.$queryRaw<{ bucket: Date; count: bigint }[]>`
      SELECT date_trunc(${unit}, "timestamp") AS bucket, COUNT(*) AS count
      FROM events
      WHERE "projectId" = ${projectId} AND "timestamp" >= ${since}
      GROUP BY 1
      ORDER BY 1`;
    return rows.map((row) => ({ bucket: row.bucket.toISOString(), count: Number(row.count) }));
  }

  async topReleases(projectId: string, since: Date): Promise<{ release: string; count: number }[]> {
    const rows = await this.prisma.event.groupBy({
      by: ['release'],
      where: { projectId, timestamp: { gte: since }, release: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { release: 'desc' } },
      take: 5,
    });
    return rows.map((row) => ({ release: row.release ?? '', count: row._count._all }));
  }

  async topEnvironments(
    projectId: string,
    since: Date,
  ): Promise<{ environment: string; count: number }[]> {
    const rows = await this.prisma.event.groupBy({
      by: ['environment'],
      where: { projectId, timestamp: { gte: since }, environment: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { environment: 'desc' } },
      take: 5,
    });
    return rows.map((row) => ({ environment: row.environment ?? '', count: row._count._all }));
  }

  rangeStart(range: StatsRange): Date {
    return new Date(Date.now() - RANGE_HOURS[range] * 60 * 60 * 1000);
  }
}
