import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { IssueListQueryDto, PageQueryDto, StatsQueryDto, UpdateIssueDto } from '../dto/issue.dto';
import {
  EventView,
  IssueDetailView,
  IssueView,
  Page,
  ProjectStatsView,
} from '../interfaces/issue.interfaces';
import { IssueMapper } from '../mappers/issue.mapper';
import { IssueRepository } from '../repositories/issue.repository';

const DEFAULT_PAGE_SIZE = 25;

@Injectable()
export class IssuesService {
  constructor(
    private readonly issueRepository: IssueRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async list(projectId: string, query: IssueListQueryDto): Promise<Page<IssueView>> {
    await this.requireProject(projectId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const { items, total } = await this.issueRepository.list({
      projectId,
      status: query.status,
      query: query.q?.trim() || undefined,
      sort: query.sort ?? 'lastSeen',
      page,
      pageSize,
    });
    return { items: items.map(IssueMapper.toView), total, page, pageSize };
  }

  async getDetail(issueId: string): Promise<IssueDetailView> {
    const issue = await this.requireIssue(issueId);
    const latestEvent = await this.issueRepository.findLatestEvent(issueId);
    return {
      issue: IssueMapper.toView(issue),
      latestEvent: latestEvent ? IssueMapper.toEventView(latestEvent) : null,
    };
  }

  async listEvents(issueId: string, query: PageQueryDto): Promise<Page<EventView>> {
    await this.requireIssue(issueId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const { items, total } = await this.issueRepository.listEvents(issueId, page, pageSize);
    return { items: items.map(IssueMapper.toEventView), total, page, pageSize };
  }

  async getEvent(eventId: string): Promise<EventView> {
    const event = await this.issueRepository.findEvent(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return IssueMapper.toEventView(event);
  }

  async getStats(projectId: string, query: StatsQueryDto): Promise<ProjectStatsView> {
    await this.requireProject(projectId);
    const range = query.range ?? '24h';
    const since = this.issueRepository.rangeStart(range);
    const [totalEvents, unresolvedIssues, newIssues, series, topReleases, topEnvironments] =
      await Promise.all([
        this.issueRepository.countEvents(projectId, since),
        this.issueRepository.countUnresolved(projectId),
        this.issueRepository.countNewIssues(projectId, since),
        this.issueRepository.eventSeries(projectId, range),
        this.issueRepository.topReleases(projectId, since),
        this.issueRepository.topEnvironments(projectId, since),
      ]);
    return { range, totalEvents, unresolvedIssues, newIssues, series, topReleases, topEnvironments };
  }

  async updateStatus(issueId: string, dto: UpdateIssueDto): Promise<IssueView> {
    await this.requireIssue(issueId);
    return IssueMapper.toView(await this.issueRepository.updateStatus(issueId, dto.status));
  }

  async remove(user: User, issueId: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.requireIssue(issueId);
    await this.issueRepository.delete(issueId);
  }

  private async requireIssue(issueId: string) {
    const issue = await this.issueRepository.findById(issueId);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    return issue;
  }

  private async requireProject(projectId: string): Promise<void> {
    if (!(await this.projectRepository.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
  }
}
