import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { ProjectsModule } from '../projects/projects.module';
import { DashboardsController } from './controllers/dashboards.controller';
import { PerformanceController } from './controllers/performance.controller';
import { PerformanceIngestController } from './controllers/performance-ingest.controller';
import { DashboardRepository } from './repositories/dashboard.repository';
import { MetricRepository } from './repositories/metric.repository';
import { SeriesRepository } from './repositories/series.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { DashboardsService } from './services/dashboards.service';
import { PerformanceIngestService } from './services/performance-ingest.service';
import { PerformanceQueryService } from './services/performance-query.service';

@Module({
  imports: [ProjectsModule, IngestModule],
  controllers: [PerformanceIngestController, PerformanceController, DashboardsController],
  providers: [
    TransactionRepository,
    MetricRepository,
    SeriesRepository,
    DashboardRepository,
    PerformanceIngestService,
    PerformanceQueryService,
    DashboardsService,
  ],
  exports: [TransactionRepository, MetricRepository],
})
export class PerformanceModule {}
