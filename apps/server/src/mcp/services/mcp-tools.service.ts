import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertRulesService } from '../../alerts/services/alert-rules.service';
import { IssueListQueryDto, PageQueryDto, StatsQueryDto } from '../../issues/dto/issue.dto';
import { IssuesService } from '../../issues/services/issues.service';
import { SeriesQueryDto } from '../../performance/dto/performance.dto';
import { DashboardsService } from '../../performance/services/dashboards.service';
import { PerformanceQueryService } from '../../performance/services/performance-query.service';
import { ProjectView } from '../../projects/interfaces/project.interfaces';
import { ProjectsService } from '../../projects/services/projects.service';
import { MAX_LIST_LIMIT } from '../constants/mcp.constants';
import { McpTool, McpToolDefinition } from '../interfaces/mcp.interfaces';
import { McpDebugMapper } from '../mappers/mcp-debug.mapper';
import { McpSetupMapper } from '../mappers/mcp-setup.mapper';
import { McpArgsValidator as Args, McpToolError } from '../validators/mcp-args.validator';

const STATUSES = ['UNRESOLVED', 'RESOLVED', 'IGNORED'] as const;
const SORTS = ['lastSeen', 'firstSeen', 'events'] as const;
const RANGES = ['1h', '24h', '7d', '30d', '90d'] as const;
const STATS_RANGES = ['24h', '7d', '30d'] as const;
const SOURCES = ['METRIC', 'TRANSACTIONS', 'ERRORS'] as const;
const PLATFORMS = ['javascript', 'react', 'node', 'python', 'react-native'] as const;
const AGGREGATIONS = ['AVG', 'SUM', 'MIN', 'MAX', 'COUNT', 'P50', 'P95', 'P99', 'RATE'] as const;

const project = {
  type: 'string',
  description: 'The project name, slug or id, for example "WePickUp Backend". See list_projects.',
};
const range = { type: 'string', enum: RANGES, description: 'Time range, default 24h' };
const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  properties,
  required,
});

@Injectable()
export class McpToolsService {
  private readonly tools: McpTool[];

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly issuesService: IssuesService,
    private readonly queryService: PerformanceQueryService,
    private readonly dashboardsService: DashboardsService,
    private readonly rulesService: AlertRulesService,
    private readonly configService: ConfigService,
  ) {
    this.tools = this.build();
  }

  list(permissions: string[]): McpToolDefinition[] {
    return this.tools
      .filter((tool) => permissions.includes(tool.permission))
      .map(({ name, description, permission, inputSchema }) => ({ name, description, permission, inputSchema }));
  }

  find(name: string): McpTool | undefined {
    return this.tools.find((tool) => tool.name === name);
  }

  private async resolveProject(args: Record<string, unknown>): Promise<ProjectView> {
    const reference = Args.text(args, 'project') ?? Args.text(args, 'projectId');
    const projects = await this.projectsService.list();
    if (!reference) {
      throw new McpToolError(`Pass "project" with a project name, slug or id. Available: ${this.names(projects)}`);
    }
    const wanted = reference.toLowerCase();
    const exact = projects.find(
      (candidate) => candidate.id === reference || candidate.slug === wanted || candidate.name.toLowerCase() === wanted,
    );
    if (exact) {
      return exact;
    }
    const partial = projects.filter(
      (candidate) => candidate.name.toLowerCase().includes(wanted) || candidate.slug.includes(wanted),
    );
    if (partial.length === 1) {
      return partial[0];
    }
    throw new McpToolError(
      partial.length > 1
        ? `"${reference}" matches several projects: ${this.names(partial)}`
        : `No project matches "${reference}". Available: ${this.names(projects)}`,
    );
  }

  private names(projects: ProjectView[]): string {
    return projects.map((candidate) => candidate.name).join(', ') || 'none yet';
  }

  private async debugView(issueId: string, eventId?: string): Promise<Record<string, unknown>> {
    const appUrl = this.configService.getOrThrow<string>('appUrl');
    const detail = await this.issuesService.getDetail(issueId);
    const event = eventId ? await this.issuesService.getEvent(eventId) : detail.latestEvent;
    return McpDebugMapper.debug(detail.issue, event, appUrl);
  }

  private build(): McpTool[] {
    return [
      {
        name: 'list_projects',
        description: 'List the projects Watchdog watches, with their names, ids and platforms. Start here.',
        permission: 'projects:read',
        inputSchema: object({}),
        run: async () =>
          (await this.projectsService.list()).map(({ id, name, slug, platform, createdAt }) => ({
            id,
            name,
            slug,
            platform,
            createdAt,
          })),
      },
      {
        name: 'create_project',
        description:
          'Create a project in Watchdog and return its DSN, upload token and a ready .env block. Platform is one of javascript, react, node, python, react-native.',
        permission: 'projects:manage',
        inputSchema: object(
          {
            name: { type: 'string', description: 'The project name, for example "Shop API"' },
            platform: { type: 'string', enum: PLATFORMS },
          },
          ['name'],
        ),
        run: async (args) => {
          const name = Args.text(args, 'name', 80);
          if (!name) {
            throw new McpToolError('"name" is required');
          }
          const created = await this.projectsService.provision({
            name,
            platform: Args.choice(args, 'platform', PLATFORMS) ?? 'javascript',
          });
          return McpSetupMapper.setup(created, this.configService.getOrThrow<string>('appUrl'), created.uploadToken);
        },
      },
      {
        name: 'get_project_setup',
        description:
          'Everything needed to connect an app to a project: the DSN, the Watchdog URL, the project id, the SDK install command, init code, the source map upload command and a .env block.',
        permission: 'projects:manage',
        inputSchema: object({ project }, ['project']),
        run: async (args) =>
          McpSetupMapper.setup(await this.resolveProject(args), this.configService.getOrThrow<string>('appUrl')),
      },
      {
        name: 'rotate_upload_token',
        description:
          'Create a new source map upload token for a project and return it with the .env block. The previous token stops working immediately.',
        permission: 'projects:manage',
        inputSchema: object({ project }, ['project']),
        run: async (args) => {
          const target = await this.resolveProject(args);
          const { uploadToken } = await this.projectsService.issueUploadToken(target.id);
          return McpSetupMapper.setup(target, this.configService.getOrThrow<string>('appUrl'), uploadToken);
        },
      },
      {
        name: 'get_latest_issue',
        description:
          'Get the most recently seen issue of a project with everything needed to debug it: the error, the stack trace mapped back to your original source files with surrounding code, breadcrumbs of what happened before, the request, tags, release and environment. Unresolved issues by default.',
        permission: 'issues:read',
        inputSchema: object({ project, status: { type: 'string', enum: STATUSES } }, ['project']),
        run: async (args) => {
          const target = await this.resolveProject(args);
          const page = await this.issuesService.list(
            target.id,
            Object.assign(new IssueListQueryDto(), {
              status: Args.choice(args, 'status', STATUSES) ?? 'UNRESOLVED',
              sort: 'lastSeen',
              page: 1,
              pageSize: 1,
            }),
          );
          const latest = page.items[0];
          if (!latest) {
            return { project: target.name, message: 'No matching issues. The project has no open errors.' };
          }
          return this.debugView(latest.id);
        },
      },
      {
        name: 'list_issues',
        description: "List a project's error issues, most recently seen first by default. Filter by status or search the title.",
        permission: 'issues:read',
        inputSchema: object(
          {
            project,
            status: { type: 'string', enum: STATUSES },
            query: { type: 'string', description: 'Search in the issue title' },
            sort: { type: 'string', enum: SORTS },
            limit: { type: 'integer', description: `Up to ${MAX_LIST_LIMIT}, default 20` },
          },
          ['project'],
        ),
        run: async (args) => {
          const target = await this.resolveProject(args);
          const query = Object.assign(new IssueListQueryDto(), {
            status: Args.choice(args, 'status', STATUSES),
            q: Args.text(args, 'query'),
            sort: Args.choice(args, 'sort', SORTS),
            page: 1,
            pageSize: Args.limit(args),
          });
          const page = await this.issuesService.list(target.id, query);
          const appUrl = this.configService.getOrThrow<string>('appUrl');
          return { total: page.total, issues: page.items.map((issue) => McpDebugMapper.issue(issue, appUrl)) };
        },
      },
      {
        name: 'get_issue',
        description:
          'Open one issue with its latest occurrence: stack trace mapped to original source files with code context, breadcrumbs, request, tags and release. Pass eventId (from list_issue_events) to look at a specific occurrence.',
        permission: 'issues:read',
        inputSchema: object({ issueId: { type: 'string' }, eventId: { type: 'string' } }, ['issueId']),
        run: (args) => {
          const eventId = args.eventId === undefined ? undefined : Args.uuid(args, 'eventId');
          return this.debugView(Args.uuid(args, 'issueId'), eventId);
        },
      },
      {
        name: 'list_issue_events',
        description: 'List recent occurrences of an issue (time, release, environment, message), newest first.',
        permission: 'issues:read',
        inputSchema: object({ issueId: { type: 'string' }, limit: { type: 'integer' } }, ['issueId']),
        run: async (args) => {
          const page = await this.issuesService.listEvents(
            Args.uuid(args, 'issueId'),
            Object.assign(new PageQueryDto(), { page: 1, pageSize: Args.limit(args) }),
          );
          return { total: page.total, events: page.items.map(McpDebugMapper.eventSummary) };
        },
      },
      {
        name: 'get_project_stats',
        description: 'Error counts over time for a project, plus its issue totals.',
        permission: 'issues:read',
        inputSchema: object({ project, range: { type: 'string', enum: STATS_RANGES } }, ['project']),
        run: async (args) =>
          this.issuesService.getStats(
            (await this.resolveProject(args)).id,
            Object.assign(new StatsQueryDto(), { range: Args.choice(args, 'range', STATS_RANGES) }),
          ),
      },
      {
        name: 'update_issue_status',
        description: 'Mark an issue UNRESOLVED, RESOLVED or IGNORED, for example after fixing it.',
        permission: 'issues:write',
        inputSchema: object({ issueId: { type: 'string' }, status: { type: 'string', enum: STATUSES } }, [
          'issueId',
          'status',
        ]),
        run: (args) =>
          this.issuesService.updateStatus(Args.uuid(args, 'issueId'), {
            status: Args.requiredChoice(args, 'status', STATUSES),
          }),
      },
      {
        name: 'transactions_summary',
        description: 'Slowest and busiest transactions of a project: counts, average, p50, p95 and failure rate.',
        permission: 'performance:read',
        inputSchema: object({ project, range, environment: { type: 'string' } }, ['project']),
        run: async (args) =>
          this.queryService.summarize(
            (await this.resolveProject(args)).id,
            Args.choice(args, 'range', RANGES),
            Args.text(args, 'environment', 100),
          ),
      },
      {
        name: 'list_metrics',
        description: 'List the custom metrics a project has sent, with their type and unit.',
        permission: 'performance:read',
        inputSchema: object({ project }, ['project']),
        run: async (args) => this.queryService.listMetricNames((await this.resolveProject(args)).id),
      },
      {
        name: 'query_series',
        description:
          'Chart data over time for a metric, transaction durations or errors. Aggregations: AVG, SUM, MIN, MAX, COUNT, P50, P95, P99, RATE (errors support COUNT and RATE only). Optionally split by a tag.',
        permission: 'performance:read',
        inputSchema: object(
          {
            project,
            source: { type: 'string', enum: SOURCES },
            name: { type: 'string', description: 'Metric name, or a transaction name to narrow to' },
            aggregation: { type: 'string', enum: AGGREGATIONS },
            range,
            environment: { type: 'string' },
            groupBy: { type: 'string', description: 'A tag key to split the series by' },
            tagKey: { type: 'string' },
            tagValue: { type: 'string' },
          },
          ['project', 'source'],
        ),
        run: async (args) =>
          this.queryService.series(
            (await this.resolveProject(args)).id,
            Object.assign(new SeriesQueryDto(), {
              source: Args.requiredChoice(args, 'source', SOURCES),
              name: Args.text(args, 'name'),
              aggregation: Args.choice(args, 'aggregation', AGGREGATIONS),
              range: Args.choice(args, 'range', RANGES),
              environment: Args.text(args, 'environment', 100),
              groupBy: Args.text(args, 'groupBy', 100),
              tagKey: Args.text(args, 'tagKey', 100),
              tagValue: Args.text(args, 'tagValue'),
            }),
          ),
      },
      {
        name: 'list_dashboards',
        description: "List a project's dashboards and the widgets on them.",
        permission: 'performance:read',
        inputSchema: object({ project }, ['project']),
        run: async (args) => this.dashboardsService.list((await this.resolveProject(args)).id),
      },
      {
        name: 'list_alert_rules',
        description: 'List the alert rules configured for a project.',
        permission: 'alerts:read',
        inputSchema: object({ project }, ['project']),
        run: async (args) => this.rulesService.list((await this.resolveProject(args)).id),
      },
    ];
  }
}
