import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { DEFAULT_PAGE_SIZE } from '../constants/performance.constants';
import { SeriesQueryDto, TransactionListQueryDto } from '../dto/performance.dto';
import type {
  Aggregation,
  MetricNameView,
  PerformancePage,
  RangeKey,
  SeriesSource,
  SeriesView,
  TransactionSummaryRow,
  TransactionView,
} from '../interfaces/performance.interfaces';
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
    return this.metricRepository.listNames(projectId);
  }

  async series(projectId: string, query: SeriesQueryDto): Promise<SeriesView> {
    await this.requireProject(projectId);
    return this.seriesFor(projectId, {
      source: query.source ?? 'TRANSACTIONS',
      name: query.name,
      aggregation: query.aggregation ?? 'P95',
      range: query.range ?? DEFAULT_RANGE,
      environment: query.environment,
    });
  }

  async seriesFor(
    projectId: string,
    input: {
      source: SeriesSource;
      name?: string;
      aggregation: Aggregation;
      range: RangeKey;
      environment?: string;
    },
  ): Promise<SeriesView> {
    const query = {
      projectId,
      source: input.source,
      name: input.name,
      aggregation: input.aggregation,
      from: RangeUtils.from(input.range),
      bucket: RangeUtils.bucket(input.range),
      environment: input.environment,
    };
    const [points, total] = await Promise.all([
      this.seriesRepository.series(query),
      this.seriesRepository.total(query),
    ]);
    return {
      points: points.map((point) => ({ timestamp: point.bucket.toISOString(), value: point.value })),
      total,
      bucketMs: RangeUtils.bucketMs(input.range),
    };
  }

  private async requireProject(projectId: string): Promise<void> {
    if (!(await this.projectRepository.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
  }
}
