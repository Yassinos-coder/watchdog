import GridLayout, { useContainerWidth } from 'react-grid-layout';
import { getCompactor } from 'react-grid-layout/core';
import 'react-grid-layout/css/styles.css';
import {
  DASHBOARD_COLUMNS,
  DASHBOARD_MARGIN,
  DASHBOARD_ROW_HEIGHT,
  STACKED_BREAKPOINT,
} from '../constants/performance.constants';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import type { PerfRange, Widget } from '../types/performance.types';
import { WidgetCard } from './WidgetCard';

interface DashboardGridProps {
  projectId: string;
  dashboardId: string;
  widgets: Widget[];
  range: PerfRange;
  canManage: boolean;
  onRemove: (widget: Widget) => void;
}

const CANVAS = getCompactor(null, false, true);

export function DashboardGrid({ projectId, dashboardId, widgets, range, canManage, onRemove }: DashboardGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const { layout, setLayout, commit } = useWidgetLayout(projectId, dashboardId, widgets);
  const stacked = width < STACKED_BREAKPOINT;

  return (
    <div ref={containerRef}>
      {mounted && stacked && (
        <div className="grid gap-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="h-72">
              <WidgetCard projectId={projectId} widget={widget} range={range} canManage={canManage} onRemove={onRemove} />
            </div>
          ))}
        </div>
      )}
      {mounted && !stacked && (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: DASHBOARD_COLUMNS, rowHeight: DASHBOARD_ROW_HEIGHT, margin: [DASHBOARD_MARGIN, DASHBOARD_MARGIN] }}
          dragConfig={{ enabled: canManage, handle: '.widget-drag' }}
          resizeConfig={{ enabled: canManage }}
          compactor={CANVAS}
          onLayoutChange={setLayout}
          onDragStop={commit}
          onResizeStop={commit}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetCard projectId={projectId} widget={widget} range={range} canManage={canManage} onRemove={onRemove} />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
