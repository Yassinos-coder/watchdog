import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { AuthContext } from '../../auth/interfaces/auth.interfaces';
import { CreateDashboardDto, UpdateLayoutDto, WidgetInput } from '../dto/dashboard.dto';
import type { DashboardView, WidgetView } from '../interfaces/performance.interfaces';
import { DashboardsService } from '../services/dashboards.service';

@Controller()
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('projects/:projectId/dashboards')
  list(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<DashboardView[]> {
    return this.dashboardsService.list(projectId);
  }

  @Post('projects/:projectId/dashboards')
  create(
    @CurrentAuth() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateDashboardDto,
  ): Promise<DashboardView> {
    return this.dashboardsService.create(auth.user, projectId, dto);
  }

  @Post('dashboards/:dashboardId/widgets')
  addWidget(
    @CurrentAuth() auth: AuthContext,
    @Param('dashboardId', ParseUUIDPipe) dashboardId: string,
    @Body() dto: WidgetInput,
  ): Promise<WidgetView> {
    return this.dashboardsService.addWidget(auth.user, dashboardId, dto);
  }

  @Patch('dashboards/:dashboardId')
  rename(
    @CurrentAuth() auth: AuthContext,
    @Param('dashboardId', ParseUUIDPipe) dashboardId: string,
    @Body() dto: CreateDashboardDto,
  ): Promise<DashboardView> {
    return this.dashboardsService.rename(auth.user, dashboardId, dto);
  }

  @Patch('dashboards/:dashboardId/layout')
  @HttpCode(204)
  updateLayout(
    @CurrentAuth() auth: AuthContext,
    @Param('dashboardId', ParseUUIDPipe) dashboardId: string,
    @Body() dto: UpdateLayoutDto,
  ): Promise<void> {
    return this.dashboardsService.updateLayout(auth.user, dashboardId, dto);
  }

  @Delete('dashboards/:dashboardId')
  @HttpCode(204)
  remove(
    @CurrentAuth() auth: AuthContext,
    @Param('dashboardId', ParseUUIDPipe) dashboardId: string,
  ): Promise<void> {
    return this.dashboardsService.remove(auth.user, dashboardId);
  }

  @Delete('widgets/:widgetId')
  @HttpCode(204)
  removeWidget(
    @CurrentAuth() auth: AuthContext,
    @Param('widgetId', ParseUUIDPipe) widgetId: string,
  ): Promise<void> {
    return this.dashboardsService.removeWidget(auth.user, widgetId);
  }
}
