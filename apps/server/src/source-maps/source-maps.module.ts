import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { SourceMapsController } from './controllers/source-maps.controller';
import { SourceMapRepository } from './repositories/source-map.repository';
import { SourceMapsService } from './services/source-maps.service';
import { SymbolicationService } from './services/symbolication.service';

@Module({
  imports: [ProjectsModule],
  controllers: [SourceMapsController],
  providers: [SourceMapRepository, SourceMapsService, SymbolicationService],
  exports: [SymbolicationService],
})
export class SourceMapsModule {}
