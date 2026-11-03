import { Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ReplayListQueryDto } from '../dto/replay.dto';
import type { ReplayEventsView, ReplayPage, ReplayView } from '../interfaces/replay.interfaces';
import { ReplaysService } from '../services/replays.service';

@Controller()
export class ReplaysController {
  constructor(private readonly replaysService: ReplaysService) {}

  @Get('projects/:projectId/replays')
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ReplayListQueryDto,
  ): Promise<ReplayPage> {
    return this.replaysService.list(projectId, query);
  }

  @Get('projects/:projectId/events/:eventId/replay')
  findForEvent(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('eventId') eventId: string,
  ): Promise<ReplayView | null> {
    return this.replaysService.findForEvent(projectId, eventId);
  }

  @Get('replays/:replayId')
  get(@Param('replayId', ParseUUIDPipe) replayId: string): Promise<ReplayEventsView> {
    return this.replaysService.getEvents(replayId);
  }

  @Delete('replays/:replayId')
  @HttpCode(204)
  remove(@Param('replayId', ParseUUIDPipe) replayId: string): Promise<void> {
    return this.replaysService.remove(replayId);
  }
}
