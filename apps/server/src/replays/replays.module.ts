import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { ProjectsModule } from '../projects/projects.module';
import { ReplayIngestController } from './controllers/replay-ingest.controller';
import { ReplaysController } from './controllers/replays.controller';
import { ReplayRepository } from './repositories/replay.repository';
import { ReplayIngestService } from './services/replay-ingest.service';
import { ReplaysService } from './services/replays.service';

@Module({
  imports: [ProjectsModule, IngestModule],
  controllers: [ReplayIngestController, ReplaysController],
  providers: [ReplayRepository, ReplayIngestService, ReplaysService],
  exports: [ReplayRepository],
})
export class ReplaysModule {}
