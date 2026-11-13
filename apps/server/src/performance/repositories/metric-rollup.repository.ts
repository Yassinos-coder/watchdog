import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MetricRollupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async latestBucket(): Promise<Date | null> {
    const result = await this.prisma.metricRollup.aggregate({ _max: { bucket: true } });
    return result._max.bucket;
  }

  async earliestMetric(): Promise<Date | null> {
    const result = await this.prisma.metric.aggregate({ _min: { timestamp: true } });
    return result._min.timestamp;
  }

  async refresh(from: Date, to: Date): Promise<number> {
    return this.prisma.$executeRaw`
      INSERT INTO "metric_rollups"
        ("id", "projectId", "name", "type", "unit", "environment", "tags", "tagsKey", "bucket",
         "count", "sum", "min", "max", "p50", "p95", "p99")
      SELECT gen_random_uuid()::text, "projectId", "name", "type", MAX("unit"), COALESCE("environment", ''),
             "tags", "tags"::text, date_trunc('hour', "timestamp"),
             COUNT(*)::int, SUM("value"), MIN("value"), MAX("value"),
             percentile_cont(0.5) WITHIN GROUP (ORDER BY "value"),
             percentile_cont(0.95) WITHIN GROUP (ORDER BY "value"),
             percentile_cont(0.99) WITHIN GROUP (ORDER BY "value")
      FROM "metrics"
      WHERE "timestamp" >= ${from} AND "timestamp" < ${to}
      GROUP BY "projectId", "name", "type", COALESCE("environment", ''), "tags", date_trunc('hour', "timestamp")
      ON CONFLICT ("projectId", "name", "type", "environment", "tagsKey", "bucket") DO UPDATE SET
        "unit" = EXCLUDED."unit",
        "count" = EXCLUDED."count",
        "sum" = EXCLUDED."sum",
        "min" = EXCLUDED."min",
        "max" = EXCLUDED."max",
        "p50" = EXCLUDED."p50",
        "p95" = EXCLUDED."p95",
        "p99" = EXCLUDED."p99"
    `;
  }
}
