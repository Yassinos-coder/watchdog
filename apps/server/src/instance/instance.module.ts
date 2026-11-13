import { Module } from '@nestjs/common';
import { InstanceController } from './controllers/instance.controller';
import { InstanceService } from './services/instance.service';

@Module({
  controllers: [InstanceController],
  providers: [InstanceService],
})
export class InstanceModule {}
