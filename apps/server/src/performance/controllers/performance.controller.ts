import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RangeQueryDto, SeriesQueryDto, TransactionListQueryDto } from '../dto/performance.dto';
import type {
  MetricNameView,
  PerformancePage,
  SeriesView,
  TransactionSummaryRow,
  TransactionView,
} from '../interfaces/performance.interfaces';
import { PerformanceQueryService } from '../services/performance-query.service';

@Controller()
export class PerformanceController {
  constructor(private readonly queryService: PerformanceQueryService) {}

  @Get('projects/:projectId/transactions/summary')
  summarize(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: RangeQueryDto,
  ): Promise<TransactionSummaryRow[]> {
    return this.queryService.summarize(projectId, query.range, query.environment);
  }

  @Get('projects/:projectId/transactions')
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: TransactionListQueryDto,
  ): Promise<PerformancePage<TransactionView>> {
    return this.queryService.listTransactions(projectId, query);
  }

  @Get('transactions/:transactionId')
  get(@Param('transactionId', ParseUUIDPipe) transactionId: string): Promise<TransactionView> {
    return this.queryService.getTransaction(transactionId);
  }

  @Get('projects/:projectId/metrics')
  listMetricNames(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<MetricNameView[]> {
    return this.queryService.listMetricNames(projectId);
  }

  @Get('projects/:projectId/series')
  series(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: SeriesQueryDto,
  ): Promise<SeriesView> {
    return this.queryService.series(projectId, query);
  }
}
