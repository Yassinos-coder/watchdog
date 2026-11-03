import { Body, Controller, Headers, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { RateLimit } from 'nestjs-shield';
import { Public } from '../../auth/decorators/access.decorators';
import { ReplayIngestService } from '../services/replay-ingest.service';

const IP_LIMIT_PER_MINUTE = 600;
const MINUTE_MS = 60_000;

@Public()
@Controller('ingest/v1')
export class ReplayIngestController {
  constructor(private readonly ingestService: ReplayIngestService) {}

  @Post(':projectId/replays')
  @HttpCode(202)
  @RateLimit({ limit: IP_LIMIT_PER_MINUTE, ttl: MINUTE_MS })
  accept(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Headers('x-watchdog-key') headerKey: string | undefined,
    @Query('key') queryKey: string | undefined,
    @Body() body: unknown,
  ): Promise<{ id: string }> {
    return this.ingestService.accept(projectId, headerKey ?? queryKey, body);
  }
}
