import type {
  Aggregation,
  SeriesSource,
  WidgetDisplayKind,
  WidgetLayout,
} from '../interfaces/performance.interfaces';

interface DefaultWidget {
  title: string;
  source: SeriesSource;
  aggregation: Aggregation;
  display: WidgetDisplayKind;
  layout: WidgetLayout;
}

export const DEFAULT_DASHBOARD_NAME = 'Overview';

export const DEFAULT_WIDGETS: DefaultWidget[] = [
  { title: 'Errors', source: 'ERRORS', aggregation: 'COUNT', display: 'BAR', layout: { x: 0, y: 0, w: 6, h: 4 } },
  { title: 'Requests', source: 'TRANSACTIONS', aggregation: 'COUNT', display: 'BAR', layout: { x: 6, y: 0, w: 6, h: 4 } },
  { title: 'Response time (p95)', source: 'TRANSACTIONS', aggregation: 'P95', display: 'LINE', layout: { x: 0, y: 4, w: 6, h: 4 } },
  { title: 'Average response time', source: 'TRANSACTIONS', aggregation: 'AVG', display: 'NUMBER', layout: { x: 6, y: 4, w: 6, h: 4 } },
];
