import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Dashboard, DashboardWidget } from '../../generated/prisma/client';
import { DEFAULT_DASHBOARD_NAME, DEFAULT_WIDGETS } from '../constants/default-dashboard.constants';
import { NEW_WIDGET_HEIGHT, NEW_WIDGET_WIDTH } from '../constants/performance.constants';
import type { WidgetInput } from '../dto/dashboard.dto';
import type { WidgetLayoutUpdate } from '../interfaces/performance.interfaces';

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

  async claimDefault(projectId: string): Promise<boolean> {
    const result = await this.prisma.project.updateMany({
      where: { id: projectId, dashboardsSeeded: false },
      data: { dashboardsSeeded: true },
    });
    return result.count === 1;
  }

  async createDefault(projectId: string): Promise<void> {
    await this.prisma.dashboard.create({
      data: {
        projectId,
        name: DEFAULT_DASHBOARD_NAME,
        widgets: {
          create: DEFAULT_WIDGETS.map(({ layout, ...widget }, position) => ({
            ...widget,
            layoutX: layout.x,
            layoutY: layout.y,
            layoutW: layout.w,
            layoutH: layout.h,
            position,
          })),
        },
      },
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

  async bottomRow(dashboardId: string): Promise<number> {
    const widgets = await this.prisma.dashboardWidget.findMany({
      where: { dashboardId },
      select: { layoutY: true, layoutH: true },
    });
    return widgets.reduce((bottom, widget) => Math.max(bottom, widget.layoutY + widget.layoutH), 0);
  }

  async updateLayout(dashboardId: string, items: WidgetLayoutUpdate[]): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.dashboardWidget.updateMany({
          where: { id: item.id, dashboardId },
          data: { layoutX: item.x, layoutY: item.y, layoutW: item.w, layoutH: item.h },
        }),
      ),
    );
  }

  addWidget(dashboardId: string, input: WidgetInput, position: number, row: number): Promise<DashboardWidget> {
    return this.prisma.dashboardWidget.create({
      data: {
        dashboardId,
        title: input.title,
        source: input.source,
        metricName: input.metricName,
        filterName: input.filterName,
        aggregation: input.aggregation,
        display: input.display,
        groupBy: input.groupBy,
        tagKey: input.tagKey,
        tagValue: input.tagValue,
        layoutX: 0,
        layoutY: row,
        layoutW: NEW_WIDGET_WIDTH,
        layoutH: NEW_WIDGET_HEIGHT,
        position,
      },
    });
  }

  async removeWidget(widgetId: string): Promise<void> {
    await this.prisma.dashboardWidget.delete({ where: { id: widgetId } });
  }
}
