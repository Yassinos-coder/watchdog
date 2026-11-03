import { Controller, Get } from '@nestjs/common';
import type { UpdateStatus } from '../interfaces/update.interfaces';
import { UpdateCheckService } from '../services/update-check.service';

@Controller('updates')
export class UpdatesController {
  constructor(private readonly updateCheckService: UpdateCheckService) {}

  @Get()
  getStatus(): Promise<UpdateStatus> {
    return this.updateCheckService.getStatus();
  }
}
