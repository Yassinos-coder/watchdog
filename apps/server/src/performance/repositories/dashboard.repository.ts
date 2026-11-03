import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Dashboard, DashboardWidget } from '../../generated/prisma/client';
import type { WidgetInput } from '../dto/dashboard.dto';

export type DashboardWithWidgets = Dashboard & { widgets: DashboardWidget[] };

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(projectId: string): Promise<DashboardWithWidgets[]> {
    return this.prisma.dashboard.findMany({
      where: { projectId },
      include: { widgets: { orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  find(dashboardId: string): Promise<DashboardWithWidgets | null> {
    return this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: { widgets: { orderBy: { position: 'asc' } } },
    });
  }

  count(projectId: string): Promise<number> {
    return this.prisma.dashboard.count({ where: { projectId } });
  }

  countWidgets(dashboardId: string): Promise<number> {
    return this.prisma.dashboardWidget.count({ where: { dashboardId } });
  }

  findWidget(widgetId: string): Promise<DashboardWidget | null> {
    return this.prisma.dashboardWidget.findUnique({ where: { id: widgetId } });
  }

  create(projectId: string, name: string): Promise<DashboardWithWidgets> {
    return this.prisma.dashboard.create({
      data: { projectId, name },
      include: { widgets: true },
    });
  }

  rename(dashboardId: string, name: string): Promise<DashboardWithWidgets> {
    return this.prisma.dashboard.update({
      where: { id: dashboardId },
      data: { name },
      include: { widgets: { orderBy: { position: 'asc' } } },
    });
  }

  async remove(dashboardId: string): Promise<void> {
    await this.prisma.dashboard.delete({ where: { id: dashboardId } });
  }

  addWidget(dashboardId: string, input: WidgetInput, position: number): Promise<DashboardWidget> {
    return this.prisma.dashboardWidget.create({
      data: {
        dashboardId,
        title: input.title,
        source: input.source,
        metricName: input.metricName,
        filterName: input.filterName,
        aggregation: input.aggregation,
        display: input.display,
        position,
      },
    });
  }

  async removeWidget(widgetId: string): Promise<void> {
    await this.prisma.dashboardWidget.delete({ where: { id: widgetId } });
  }
}
