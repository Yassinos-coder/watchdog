import type { Aggregation, SeriesSource, WidgetDisplayKind } from '../interfaces/performance.interfaces';

interface DefaultWidget {
  title: string;
  source: SeriesSource;
  aggregation: Aggregation;
  display: WidgetDisplayKind;
}

export const DEFAULT_DASHBOARD_NAME = 'Overview';

export const DEFAULT_WIDGETS: DefaultWidget[] = [
  { title: 'Errors', source: 'ERRORS', aggregation: 'COUNT', display: 'BAR' },
  { title: 'Requests', source: 'TRANSACTIONS', aggregation: 'COUNT', display: 'BAR' },
  { title: 'Response time (p95)', source: 'TRANSACTIONS', aggregation: 'P95', display: 'LINE' },
  { title: 'Average response time', source: 'TRANSACTIONS', aggregation: 'AVG', display: 'NUMBER' },
];
