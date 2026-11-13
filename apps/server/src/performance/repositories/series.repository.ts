import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import {
  MAX_GROUPS,
  MAX_TAG_KEYS_LISTED,
  MAX_TAG_VALUES_LISTED,
  NO_GROUP_LABEL,
  ROLLUP_HOUR_MS,
  TAG_KEY_LOOKBACK_MS,
  TAG_KEY_SAMPLE_ROWS,
} from '../constants/performance.constants';
import type {
  Aggregation,
  GroupedPoint,
  GroupTotal,
  SeriesQuery,
  SeriesSource,
  TagKeyView,
} from '../interfaces/performance.interfaces';

interface Dataset {
  table: Prisma.Sql;
  time: Prisma.Sql;
  aggregate: (aggregation: Aggregation, seconds: number) => Prisma.Sql;
}

interface RawPoint {
  ts: Date;
  grp: string | null;
  value: number | null;
}

interface RawGroupTotal {
  grp: string;
  value: number | null;
}

interface RawTotal {
  value: number | null;
}

interface RawTag {
  key: string;
  value: string;
}

const percentile = (fraction: number, value: Prisma.Sql): Prisma.Sql =>
  Prisma.sql`percentile_cont(${fraction}::float8) WITHIN GROUP (ORDER BY ${value})`;

const rawAggregate =
  (value: string, rate: (seconds: number) => Prisma.Sql) =>
  (aggregation: Aggregation, seconds: number): Prisma.Sql => {
    const column = Prisma.raw(value);
    const aggregates: Record<Aggregation, Prisma.Sql> = {
      AVG: Prisma.sql`AVG(${column})`,
      SUM: Prisma.sql`SUM(${column})`,
      MIN: Prisma.sql`MIN(${column})`,
      MAX: Prisma.sql`MAX(${column})`,
      COUNT: Prisma.sql`COUNT(*)`,
      P50: percentile(0.5, column),
      P95: percentile(0.95, column),
      P99: percentile(0.99, column),
      RATE: rate(seconds),
    };
    return aggregates[aggregation];
  };

const weighted = (column: string): Prisma.Sql =>
  Prisma.sql`SUM(${Prisma.raw(`"${column}"`)} * "count") / NULLIF(SUM("count"), 0)`;

const rollupAggregate = (aggregation: Aggregation, seconds: number): Prisma.Sql => {
  const aggregates: Record<Aggregation, Prisma.Sql> = {
    AVG: Prisma.sql`SUM("sum") / NULLIF(SUM("count"), 0)`,
    SUM: Prisma.sql`SUM("sum")`,
    MIN: Prisma.sql`MIN("min")`,
    MAX: Prisma.sql`MAX("max")`,
    COUNT: Prisma.sql`SUM("count")`,
    P50: weighted('p50'),
    P95: weighted('p95'),
    P99: weighted('p99'),
    RATE: Prisma.sql`SUM("sum") / ${seconds}::float8`,
  };
  return aggregates[aggregation];
};

const DATASETS = {
  METRIC: {
    table: Prisma.raw('"metrics"'),
    time: Prisma.raw('"timestamp"'),
    aggregate: rawAggregate('"value"', (seconds) => Prisma.sql`SUM("value") / ${seconds}::float8`),
  },
  TRANSACTIONS: {
    table: Prisma.raw('"transactions"'),
    time: Prisma.raw('"timestamp"'),
    aggregate: rawAggregate('"durationMs"', (seconds) => Prisma.sql`COUNT(*) / ${seconds}::float8`),
  },
  ROLLUP: {
    table: Prisma.raw('"metric_rollups"'),
    time: Prisma.raw('"bucket"'),
    aggregate: rollupAggregate,
  },
} satisfies Record<string, Dataset>;

@Injectable()
export class SeriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async series(query: SeriesQuery): Promise<GroupedPoint[]> {
    const dataset = this.dataset(query);
    const aggregate = dataset.aggregate(query.aggregation, query.bucketSeconds);
    const group = query.groupBy ? this.groupExpression(query.groupBy) : Prisma.sql`NULL::text`;
    const rows = await this.prisma.$queryRaw<RawPoint[]>`
      SELECT date_bin(${query.bucket}::interval, ${dataset.time}, TIMESTAMP '2001-01-01') AS ts,
             ${group} AS grp,
             ${aggregate}::float8 AS value
      FROM ${dataset.table}
      WHERE ${this.filters(query, dataset)}
      GROUP BY ts, grp
      ORDER BY ts ASC
    `;
    return rows.map((row) => ({ bucket: row.ts, key: row.grp ?? '', value: this.toNumber(row.value) }));
  }

  async total(query: SeriesQuery): Promise<number | null> {
    const dataset = this.dataset(query);
    const aggregate = dataset.aggregate(query.aggregation, query.windowSeconds);
    const rows = await this.prisma.$queryRaw<RawTotal[]>`
      SELECT ${aggregate}::float8 AS value FROM ${dataset.table} WHERE ${this.filters(query, dataset)}
    `;
    return this.toNumber(rows[0]?.value);
  }

  async groupTotals(query: SeriesQuery & { groupBy: string }): Promise<GroupTotal[]> {
    const dataset = this.dataset(query);
    const aggregate = dataset.aggregate(query.aggregation, query.windowSeconds);
    const rows = await this.prisma.$queryRaw<RawGroupTotal[]>`
      SELECT ${this.groupExpression(query.groupBy)} AS grp, ${aggregate}::float8 AS value
      FROM ${dataset.table}
      WHERE ${this.filters(query, dataset)}
      GROUP BY grp
      ORDER BY value DESC NULLS LAST
      LIMIT ${MAX_GROUPS}
    `;
    return rows.map((row) => ({ key: row.grp, value: this.toNumber(row.value) }));
  }

  async tagKeys(projectId: string, source: SeriesSource, name?: string, now = Date.now()): Promise<TagKeyView[]> {
    const { table } = DATASETS[source];
    const since = new Date(now - TAG_KEY_LOOKBACK_MS);
    const nameFilter = name ? Prisma.sql`AND "name" = ${name}` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<RawTag[]>`
      SELECT kv.key AS key, kv.value AS value
      FROM (
        SELECT "tags" FROM ${table}
        WHERE "projectId" = ${projectId} AND "timestamp" >= ${since} ${nameFilter}
        ORDER BY "timestamp" DESC
        LIMIT ${TAG_KEY_SAMPLE_ROWS}
      ) sample, jsonb_each_text(sample."tags") kv
      GROUP BY kv.key, kv.value
    `;
    return this.collectTags(rows);
  }

  private collectTags(rows: RawTag[]): TagKeyView[] {
    const byKey = new Map<string, string[]>();
    for (const row of rows) {
      const values = byKey.get(row.key) ?? [];
      if (values.length < MAX_TAG_VALUES_LISTED) {
        values.push(row.value);
      }
      byKey.set(row.key, values);
    }
    return [...byKey.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, MAX_TAG_KEYS_LISTED)
      .map(([key, values]) => ({ key, values: values.sort() }));
  }

  private dataset(query: SeriesQuery): Dataset {
    if (query.rollup && query.source === 'METRIC') {
      return DATASETS.ROLLUP;
    }
    return DATASETS[query.source];
  }

  private groupExpression(key: string): Prisma.Sql {
    return Prisma.sql`COALESCE("tags" ->> ${key}::text, ${NO_GROUP_LABEL}::text)`;
  }

  private filters(query: SeriesQuery, dataset: Dataset): Prisma.Sql {
    const from = dataset === DATASETS.ROLLUP ? new Date(Math.floor(query.from.getTime() / ROLLUP_HOUR_MS) * ROLLUP_HOUR_MS) : query.from;
    const clauses = [Prisma.sql`"projectId" = ${query.projectId}`, Prisma.sql`${dataset.time} >= ${from}`];
    if (query.name) {
      clauses.push(Prisma.sql`"name" = ${query.name}`);
    }
    if (query.environment) {
      clauses.push(Prisma.sql`"environment" = ${query.environment}`);
    }
    if (query.tag) {
      clauses.push(Prisma.sql`"tags" ->> ${query.tag.key}::text = ${query.tag.value}::text`);
    }
    return Prisma.join(clauses, ' AND ');
  }

  private toNumber(value: number | null | undefined): number | null {
    return value === null || value === undefined ? null : Number(value);
  }
}
