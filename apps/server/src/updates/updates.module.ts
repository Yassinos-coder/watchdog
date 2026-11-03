import { Module } from '@nestjs/common';
import { UpdatesController } from './controllers/updates.controller';
import { UpdateCheckService } from './services/update-check.service';

@Module({
  controllers: [UpdatesController],
  providers: [UpdateCheckService],
})
export class UpdatesModule {}
