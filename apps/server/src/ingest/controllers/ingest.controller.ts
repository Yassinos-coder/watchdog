import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RateLimit } from 'nestjs-shield';
import { Public } from '../../auth/decorators/access.decorators';
import { IngestService } from '../services/ingest.service';

const IP_LIMIT_PER_MINUTE = 3_000;
const MINUTE_MS = 60_000;

@Public()
@Controller('ingest/v1')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post(':projectId/events')
  @HttpCode(202)
  @RateLimit({ limit: IP_LIMIT_PER_MINUTE, ttl: MINUTE_MS })
  async accept(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Headers('x-watchdog-key') headerKey: string | undefined,
    @Query('key') queryKey: string | undefined,
    @Body() body: unknown,
  ): Promise<{ id: string }> {
    const result = await this.ingestService.accept(projectId, headerKey ?? queryKey, body);
    return { id: result.eventId };
  }
}
