import { Controller, Get } from '@nestjs/common';
import { InstanceView } from '../interfaces/instance.interfaces';
import { InstanceService } from '../services/instance.service';

@Controller('settings/instance')
export class InstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Get()
  get(): InstanceView {
    return this.instanceService.get();
  }
}
