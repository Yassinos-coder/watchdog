import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/decorators/access.decorators';
import { HealthStatus, ReadinessStatus } from '../interfaces/health-status.interface';
import { HealthService } from '../services/health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  getLive(): HealthStatus {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  getReady(): Promise<ReadinessStatus> {
    return this.healthService.getReadiness();
  }
}
