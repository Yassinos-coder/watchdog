import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext } from '../../auth/interfaces/auth.interfaces';
import { IssueListQueryDto, PageQueryDto, StatsQueryDto, UpdateIssueDto } from '../dto/issue.dto';
import {
  EventView,
  IssueDetailView,
  IssueView,
  Page,
  ProjectStatsView,
} from '../interfaces/issue.interfaces';
import { IssuesService } from '../services/issues.service';

@Controller()
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('projects/:projectId/issues')
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: IssueListQueryDto,
  ): Promise<Page<IssueView>> {
    return this.issuesService.list(projectId, query);
  }

  @Get('projects/:projectId/stats')
  getStats(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: StatsQueryDto,
  ): Promise<ProjectStatsView> {
    return this.issuesService.getStats(projectId, query);
  }

  @Get('issues/:issueId')
  getDetail(@Param('issueId', ParseUUIDPipe) issueId: string): Promise<IssueDetailView> {
    return this.issuesService.getDetail(issueId);
  }

  @Get('issues/:issueId/events')
  listEvents(
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Query() query: PageQueryDto,
  ): Promise<Page<EventView>> {
    return this.issuesService.listEvents(issueId, query);
  }

  @Get('events/:eventId')
  getEvent(@Param('eventId', ParseUUIDPipe) eventId: string): Promise<EventView> {
    return this.issuesService.getEvent(eventId);
  }

  @Patch('issues/:issueId')
  updateStatus(
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Body() dto: UpdateIssueDto,
  ): Promise<IssueView> {
    return this.issuesService.updateStatus(issueId, dto);
  }

  @Delete('issues/:issueId')
  @HttpCode(204)
  remove(
    @CurrentAuth() auth: AuthContext,
    @Param('issueId', ParseUUIDPipe) issueId: string,
  ): Promise<void> {
    return this.issuesService.remove(auth.user, issueId);
  }
}
