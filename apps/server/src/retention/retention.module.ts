import { Module } from '@nestjs/common';
import { RetentionRepository } from './repositories/retention.repository';
import { RetentionService } from './services/retention.service';

@Module({
  providers: [RetentionRepository, RetentionService],
  exports: [RetentionService],
})
export class RetentionModule {}
