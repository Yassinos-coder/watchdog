import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { SourceMapsModule } from '../source-maps/source-maps.module';
import { IngestController } from './controllers/ingest.controller';
import { IngestRepository } from './repositories/ingest.repository';
import { IngestService } from './services/ingest.service';
import { ProjectRateLimiterService } from './services/project-rate-limiter.service';

@Module({
  imports: [ProjectsModule, SourceMapsModule],
  controllers: [IngestController],
  providers: [IngestRepository, IngestService, ProjectRateLimiterService],
  exports: [ProjectRateLimiterService],
})
export class IngestModule {}
