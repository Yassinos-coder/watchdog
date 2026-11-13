import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleValidator } from '../../auth/validators/role.validator';
import type { User } from '../../generated/prisma/client';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import {
  MAX_DASHBOARDS_PER_PROJECT,
  MAX_WIDGETS_PER_DASHBOARD,
} from '../constants/performance.constants';
import { CreateDashboardDto, UpdateLayoutDto, WidgetInput } from '../dto/dashboard.dto';
import type { DashboardView, WidgetView } from '../interfaces/performance.interfaces';
import { WidgetLayoutValidator } from '../validators/widget-layout.validator';
import { SeriesSourceValidator } from '../validators/series-source.validator';
import { PerformanceMapper } from '../mappers/performance.mapper';
import { DashboardRepository } from '../repositories/dashboard.repository';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async list(projectId: string): Promise<DashboardView[]> {
    await this.requireProject(projectId);
    if (await this.dashboardRepository.claimDefault(projectId)) {
      await this.dashboardRepository.createDefault(projectId);
    }
    const dashboards = await this.dashboardRepository.list(projectId);
    return dashboards.map(PerformanceMapper.toDashboardView);
  }

  async create(user: User, projectId: string, dto: CreateDashboardDto): Promise<DashboardView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.requireProject(projectId);
    if ((await this.dashboardRepository.count(projectId)) >= MAX_DASHBOARDS_PER_PROJECT) {
      throw new BadRequestException(`A project can have at most ${MAX_DASHBOARDS_PER_PROJECT} dashboards`);
    }
    const dashboard = await this.dashboardRepository.create(projectId, dto.name.trim());
    return PerformanceMapper.toDashboardView(dashboard);
  }

  async rename(user: User, dashboardId: string, dto: CreateDashboardDto): Promise<DashboardView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.requireDashboard(dashboardId);
    const dashboard = await this.dashboardRepository.rename(dashboardId, dto.name.trim());
    return PerformanceMapper.toDashboardView(dashboard);
  }

  async addWidget(user: User, dashboardId: string, input: WidgetInput): Promise<WidgetView> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.requireDashboard(dashboardId);
    SeriesSourceValidator.assertSupported(input);
    if (input.tagKey !== undefined && input.tagValue === undefined) {
      throw new BadRequestException('A tag filter needs both a key and a value');
    }
    const position = await this.dashboardRepository.countWidgets(dashboardId);
    if (position >= MAX_WIDGETS_PER_DASHBOARD) {
      throw new BadRequestException(`A dashboard can have at most ${MAX_WIDGETS_PER_DASHBOARD} widgets`);
    }
    const row = await this.dashboardRepository.bottomRow(dashboardId);
    const widget = await this.dashboardRepository.addWidget(dashboardId, input, position, row);
    return PerformanceMapper.toWidgetView(widget);
  }

  async updateLayout(user: User, dashboardId: string, dto: UpdateLayoutDto): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    const dashboard = await this.dashboardRepository.find(dashboardId);
    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }
    WidgetLayoutValidator.assertFits(
      dto.items,
      dashboard.widgets.map((widget) => widget.id),
    );
    await this.dashboardRepository.updateLayout(dashboardId, dto.items);
  }

  async remove(user: User, dashboardId: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    await this.requireDashboard(dashboardId);
    await this.dashboardRepository.remove(dashboardId);
  }

  async removeWidget(user: User, widgetId: string): Promise<void> {
    RoleValidator.assertAtLeast(user.role, 'ADMIN');
    if (!(await this.dashboardRepository.findWidget(widgetId))) {
      throw new NotFoundException('Widget not found');
    }
    await this.dashboardRepository.removeWidget(widgetId);
  }

  private async requireDashboard(dashboardId: string): Promise<void> {
    if (!(await this.dashboardRepository.find(dashboardId))) {
      throw new NotFoundException('Dashboard not found');
    }
  }

  private async requireProject(projectId: string): Promise<void> {
    if (!(await this.projectRepository.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
  }
}
