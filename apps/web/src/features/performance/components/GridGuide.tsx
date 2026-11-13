import type { Layout } from 'react-grid-layout';
import {
  DASHBOARD_COLUMNS,
  DASHBOARD_MARGIN,
  DASHBOARD_MAX_ROWS,
  DASHBOARD_ROW_HEIGHT,
  GUIDE_SPARE_ROWS,
} from '../constants/performance.constants';

interface GridGuideProps {
  width: number;
  layout: Layout;
}

export class GridGuideUtils {
  static rows(layout: Layout): number {
    const bottom = Math.max(...layout.map((item) => item.y + item.h), 0);
    return Math.min(bottom + GUIDE_SPARE_ROWS, DASHBOARD_MAX_ROWS);
  }

  static height(layout: Layout): number {
    const rows = GridGuideUtils.rows(layout);
    return rows * DASHBOARD_ROW_HEIGHT + (rows - 1) * DASHBOARD_MARGIN;
  }
}

export function GridGuide({ width, layout }: GridGuideProps) {
  const cellWidth = (width - DASHBOARD_MARGIN * (DASHBOARD_COLUMNS - 1)) / DASHBOARD_COLUMNS;
  const rows = GridGuideUtils.rows(layout);
  const cells = Array.from({ length: rows * DASHBOARD_COLUMNS }, (_, index) => index);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {cells.map((index) => (
        <div
          key={index}
          className="absolute rounded-md bg-muted/60"
          style={{
            width: cellWidth,
            height: DASHBOARD_ROW_HEIGHT,
            left: (index % DASHBOARD_COLUMNS) * (cellWidth + DASHBOARD_MARGIN),
            top: Math.floor(index / DASHBOARD_COLUMNS) * (DASHBOARD_ROW_HEIGHT + DASHBOARD_MARGIN),
          }}
        />
      ))}
    </div>
  );
}
