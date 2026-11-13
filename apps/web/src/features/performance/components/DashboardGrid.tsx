import GridLayout, { useContainerWidth } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { getCompactor } from 'react-grid-layout/core';
import 'react-grid-layout/css/styles.css';
import {
  DASHBOARD_COLUMNS,
  DASHBOARD_MARGIN,
  DASHBOARD_ROW_HEIGHT,
  STACKED_BREAKPOINT,
} from '../constants/performance.constants';
import type { PerfRange, Widget } from '../types/performance.types';
import { WidgetCard } from './WidgetCard';

interface DashboardGridProps {
  projectId: string;
  widgets: Widget[];
  layout: Layout;
  range: PerfRange;
  editing: boolean;
  onLayoutChange: (layout: Layout) => void;
  onRemove: (widget: Widget) => void;
}

const CANVAS = getCompactor(null, false, true);

export function DashboardGrid({ projectId, widgets, layout, range, editing, onLayoutChange, onRemove }: DashboardGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const stacked = width < STACKED_BREAKPOINT;

  return (
    <div ref={containerRef} className={editing ? 'select-none' : undefined}>
      {mounted && stacked && (
        <div className="grid gap-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="h-72">
              <WidgetCard projectId={projectId} widget={widget} range={range} editing={editing} onRemove={onRemove} />
            </div>
          ))}
        </div>
      )}
      {mounted && !stacked && (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: DASHBOARD_COLUMNS, rowHeight: DASHBOARD_ROW_HEIGHT, margin: [DASHBOARD_MARGIN, DASHBOARD_MARGIN] }}
          dragConfig={{ enabled: editing, handle: '.widget-drag' }}
          resizeConfig={{ enabled: editing }}
          compactor={CANVAS}
          onLayoutChange={onLayoutChange}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetCard projectId={projectId} widget={widget} range={range} editing={editing} onRemove={onRemove} />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
