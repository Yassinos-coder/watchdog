import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { DEFAULT_PAGE_SIZE } from '../constants/performance.constants';
import { SeriesQueryDto, TagKeysQueryDto, TransactionListQueryDto } from '../dto/performance.dto';
import type {
  Aggregation,
  MetricNameView,
  PerformancePage,
  RangeKey,
  SeriesQuery,
  SeriesSource,
  SeriesView,
  TagFilter,
  TagKeyView,
  TransactionSummaryRow,
  TransactionView,
} from '../interfaces/performance.interfaces';
import { SeriesSourceValidator } from '../validators/series-source.validator';
import { PerformanceMapper } from '../mappers/performance.mapper';
import { MetricRepository } from '../repositories/metric.repository';
import { SeriesRepository } from '../repositories/series.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { RangeUtils } from '../utils/range.utils';

const DEFAULT_RANGE: RangeKey = '24h';

@Injectable()
export class PerformanceQueryService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly metricRepository: MetricRepository,
    private readonly seriesRepository: SeriesRepository,
  ) {}

  async summarize(
    projectId: string,
    range: RangeKey = DEFAULT_RANGE,
    environment?: string,
  ): Promise<TransactionSummaryRow[]> {
    await this.requireProject(projectId);
    return this.transactionRepository.summarize(projectId, RangeUtils.from(range), environment);
  }

  async listTransactions(
    projectId: string,
    query: TransactionListQueryDto,
  ): Promise<PerformancePage<TransactionView>> {
    await this.requireProject(projectId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const { items, total } = await this.transactionRepository.list(projectId, query.name, page, pageSize);
    return { items: items.map(PerformanceMapper.toTransactionView), total, page, pageSize };
  }

  async getTransaction(transactionId: string): Promise<TransactionView> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return PerformanceMapper.toTransactionView(transaction);
  }

  async listMetricNames(projectId: string): Promise<MetricNameView[]> {
    await this.requireProject(projectId);
    const [recent, rolledUp] = await Promise.all([
      this.metricRepository.listNames(projectId),
      this.metricRepository.listRolledUpNames(projectId),
    ]);
    const known = new Set(recent.map((metric) => `${metric.name}:${metric.type}`));
    const older = rolledUp.filter((metric) => !known.has(`${metric.name}:${metric.type}`));
    return [...recent, ...older].sort((a, b) => a.name.localeCompare(b.name));
  }

  async series(projectId: string, query: SeriesQueryDto): Promise<SeriesView> {
    await this.requireProject(projectId);
    const source = query.source ?? 'TRANSACTIONS';
    const aggregation = query.aggregation ?? (source === 'ERRORS' ? 'COUNT' : 'P95');
    SeriesSourceValidator.assertSupported({ source, aggregation, groupBy: query.groupBy, tagKey: query.tagKey });
    return this.seriesFor(projectId, {
      source,
      name: query.name,
      aggregation,
      range: query.range ?? DEFAULT_RANGE,
      environment: query.environment,
      groupBy: query.groupBy,
      tag: query.tagKey && query.tagValue !== undefined ? { key: query.tagKey, value: query.tagValue } : undefined,
    });
  }

  async tagKeys(projectId: string, query: TagKeysQueryDto): Promise<TagKeyView[]> {
    await this.requireProject(projectId);
    return this.seriesRepository.tagKeys(projectId, query.source ?? 'METRIC', query.name);
  }

  async seriesFor(
    projectId: string,
    input: {
      source: SeriesSource;
      name?: string;
      aggregation: Aggregation;
      range: RangeKey;
      environment?: string;
      groupBy?: string;
      tag?: TagFilter;
    },
  ): Promise<SeriesView> {
    const query: SeriesQuery = {
      projectId,
      source: input.source,
      name: input.name,
      aggregation: input.aggregation,
      from: RangeUtils.from(input.range),
      bucket: RangeUtils.bucket(input.range),
      bucketSeconds: RangeUtils.bucketMs(input.range) / 1000,
      windowSeconds: RangeUtils.windowSeconds(input.range),
      environment: input.environment,
      tag: input.tag,
      groupBy: input.groupBy,
      rollup: RangeUtils.usesRollups(input.range, input.source),
    };
    const bucketMs = RangeUtils.bucketMs(input.range);
    if (query.groupBy) {
      return this.groupedSeries({ ...query, groupBy: query.groupBy }, bucketMs);
    }
    const [points, total] = await Promise.all([
      this.seriesRepository.series(query),
      this.seriesRepository.total(query),
    ]);
    return {
      points: points.map((point) => ({ timestamp: point.bucket.toISOString(), value: point.value })),
      total,
      bucketMs,
    };
  }

  private async groupedSeries(query: SeriesQuery & { groupBy: string }, bucketMs: number): Promise<SeriesView> {
    const [points, totals] = await Promise.all([
      this.seriesRepository.series(query),
      this.seriesRepository.groupTotals(query),
    ]);
    const groups = totals.map((group) => ({
      key: group.key,
      total: group.value,
      points: points
        .filter((point) => point.key === group.key)
        .map((point) => ({ timestamp: point.bucket.toISOString(), value: point.value })),
    }));
    return { points: [], total: null, bucketMs, groups };
  }

  private async requireProject(projectId: string): Promise<void> {
    if (!(await this.projectRepository.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
  }
}
