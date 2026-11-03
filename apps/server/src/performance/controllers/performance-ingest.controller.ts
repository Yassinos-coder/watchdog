import { Body, Controller, Headers, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { RateLimit } from 'nestjs-shield';
import { Public } from '../../auth/decorators/access.decorators';
import { PerformanceIngestService } from '../services/performance-ingest.service';

const IP_LIMIT_PER_MINUTE = 3_000;
const MINUTE_MS = 60_000;

@Public()
@Controller('ingest/v1')
export class PerformanceIngestController {
  constructor(private readonly ingestService: PerformanceIngestService) {}

  @Post(':projectId/transactions')
  @HttpCode(202)
  @RateLimit({ limit: IP_LIMIT_PER_MINUTE, ttl: MINUTE_MS })
  acceptTransaction(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Headers('x-watchdog-key') headerKey: string | undefined,
    @Query('key') queryKey: string | undefined,
    @Body() body: unknown,
  ): Promise<{ id: string }> {
    return this.ingestService.acceptTransaction(projectId, headerKey ?? queryKey, body);
  }

  @Post(':projectId/metrics')
  @HttpCode(202)
  @RateLimit({ limit: IP_LIMIT_PER_MINUTE, ttl: MINUTE_MS })
  acceptMetrics(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Headers('x-watchdog-key') headerKey: string | undefined,
    @Query('key') queryKey: string | undefined,
    @Body() body: unknown,
  ): Promise<{ accepted: number }> {
    return this.ingestService.acceptMetrics(projectId, headerKey ?? queryKey, body);
  }
}
