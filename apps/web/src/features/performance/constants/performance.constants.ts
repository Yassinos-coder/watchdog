import type { Aggregation, PerfRange, WidgetDisplay } from '../types/performance.types';

export const PERF_RANGES: { value: PerfRange; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export const AGGREGATION_OPTIONS: { value: Aggregation; label: string }[] = [
  { value: 'AVG', label: 'Average' },
  { value: 'P50', label: 'Median (p50)' },
  { value: 'P95', label: 'p95' },
  { value: 'P99', label: 'p99' },
  { value: 'MAX', label: 'Maximum' },
  { value: 'MIN', label: 'Minimum' },
  { value: 'SUM', label: 'Sum' },
  { value: 'COUNT', label: 'Count' },
  { value: 'RATE', label: 'Rate per second' },
];

export const ERROR_AGGREGATION_OPTIONS = AGGREGATION_OPTIONS.filter(
  (option) => option.value === 'COUNT' || option.value === 'RATE',
);

export const DISPLAY_OPTIONS: { value: WidgetDisplay; label: string }[] = [
  { value: 'LINE', label: 'Line chart' },
  { value: 'BAR', label: 'Bar chart' },
  { value: 'NUMBER', label: 'Single number' },
  { value: 'TABLE', label: 'Table' },
];

export const DASHBOARD_COLUMNS = 12;
export const DASHBOARD_ROW_HEIGHT = 56;
export const DASHBOARD_MARGIN = 16;
export const MIN_WIDGET_WIDTH = 3;
export const MIN_WIDGET_HEIGHT = 3;
export const STACKED_BREAKPOINT = 720;
