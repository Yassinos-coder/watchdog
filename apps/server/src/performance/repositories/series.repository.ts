import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { Aggregation, SeriesQuery, SeriesSource } from '../interfaces/performance.interfaces';

interface SourceSql {
  table: Prisma.Sql;
  value: Prisma.Sql;
  nameColumn: Prisma.Sql;
}

interface RawPoint {
  bucket: Date;
  value: number | null;
}

interface RawTotal {
  value: number | null;
}

const SOURCES: Record<SeriesSource, SourceSql> = {
  METRIC: { table: Prisma.raw('"metrics"'), value: Prisma.raw('"value"'), nameColumn: Prisma.raw('"name"') },
  TRANSACTIONS: {
    table: Prisma.raw('"transactions"'),
    value: Prisma.raw('"durationMs"'),
    nameColumn: Prisma.raw('"name"'),
  },
};

const AGGREGATIONS: Record<Aggregation, (value: Prisma.Sql) => Prisma.Sql> = {
  AVG: (value) => Prisma.sql`AVG(${value})`,
  SUM: (value) => Prisma.sql`SUM(${value})`,
  MIN: (value) => Prisma.sql`MIN(${value})`,
  MAX: (value) => Prisma.sql`MAX(${value})`,
  COUNT: () => Prisma.sql`COUNT(*)`,
  P50: (value) => Prisma.sql`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${value})`,
  P95: (value) => Prisma.sql`percentile_cont(0.95) WITHIN GROUP (ORDER BY ${value})`,
  P99: (value) => Prisma.sql`percentile_cont(0.99) WITHIN GROUP (ORDER BY ${value})`,
};

@Injectable()
export class SeriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async series(query: SeriesQuery): Promise<{ bucket: Date; value: number | null }[]> {
    const { table, value } = SOURCES[query.source];
    const aggregate = AGGREGATIONS[query.aggregation](value);
    const rows = await this.prisma.$queryRaw<RawPoint[]>`
      SELECT date_bin(${query.bucket}::interval, "timestamp", TIMESTAMP '2001-01-01') AS bucket,
             ${aggregate}::float8 AS value
      FROM ${table}
      WHERE ${this.filters(query)}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
    return rows.map((row) => ({ bucket: row.bucket, value: row.value === null ? null : Number(row.value) }));
  }

  async total(query: SeriesQuery): Promise<number | null> {
    const { table, value } = SOURCES[query.source];
    const aggregate = AGGREGATIONS[query.aggregation](value);
    const rows = await this.prisma.$queryRaw<RawTotal[]>`
      SELECT ${aggregate}::float8 AS value FROM ${table} WHERE ${this.filters(query)}
    `;
    const total = rows[0]?.value;
    return total === null || total === undefined ? null : Number(total);
  }

  private filters(query: SeriesQuery): Prisma.Sql {
    const { nameColumn } = SOURCES[query.source];
    const clauses = [
      Prisma.sql`"projectId" = ${query.projectId}`,
      Prisma.sql`"timestamp" >= ${query.from}`,
    ];
    if (query.name) {
      clauses.push(Prisma.sql`${nameColumn} = ${query.name}`);
    }
    if (query.environment) {
      clauses.push(Prisma.sql`"environment" = ${query.environment}`);
    }
    return Prisma.join(clauses, ' AND ');
  }
}
