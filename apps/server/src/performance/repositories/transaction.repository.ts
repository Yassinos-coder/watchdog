import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { Transaction } from '../../generated/prisma/client';
import type { TransactionInput, TransactionSummaryRow } from '../interfaces/performance.interfaces';

interface RawSummary {
  name: string;
  op: string;
  count: number;
  avg: number;
  p50: number;
  p95: number;
  max: number;
  failure: number;
}

const SUMMARY_LIMIT = 100;

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async summarize(projectId: string, from: Date, environment?: string): Promise<TransactionSummaryRow[]> {
    const environmentFilter = environment ? Prisma.sql`AND "environment" = ${environment}` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<RawSummary[]>`
      SELECT "name",
             MIN("op") AS op,
             COUNT(*)::int AS count,
             AVG("durationMs")::float8 AS avg,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY "durationMs")::float8 AS p50,
             percentile_cont(0.95) WITHIN GROUP (ORDER BY "durationMs")::float8 AS p95,
             MAX("durationMs")::float8 AS max,
             AVG(CASE WHEN "status" <> 'ok' THEN 1 ELSE 0 END)::float8 AS failure
      FROM "transactions"
      WHERE "projectId" = ${projectId} AND "timestamp" >= ${from} ${environmentFilter}
      GROUP BY "name"
      ORDER BY count DESC
      LIMIT ${SUMMARY_LIMIT}
    `;
    return rows.map((row) => ({
      name: row.name,
      op: row.op,
      count: Number(row.count),
      avgMs: Number(row.avg),
      p50Ms: Number(row.p50),
      p95Ms: Number(row.p95),
      maxMs: Number(row.max),
      failureRate: Number(row.failure),
    }));
  }

  async list(
    projectId: string,
    name: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ items: Transaction[]; total: number }> {
    const where: Prisma.TransactionWhereInput = { projectId, ...(name ? { name } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  async insert(projectId: string, input: TransactionInput): Promise<void> {
    await this.prisma.transaction.createMany({
      data: [
        {
          projectId,
          eventId: input.eventId,
          traceId: input.traceId,
          name: input.name,
          op: input.op,
          status: input.status,
          timestamp: input.timestamp,
          durationMs: input.durationMs,
          release: input.release,
          environment: input.environment,
          spans: input.spans as unknown as Prisma.InputJsonValue,
          tags: input.tags,
        },
      ],
      skipDuplicates: true,
    });
  }
}
