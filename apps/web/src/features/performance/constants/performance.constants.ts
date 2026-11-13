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

export const DISPLAY_OPTIONS: { value: WidgetDisplay; label: string }[] = [
  { value: 'LINE', label: 'Line chart' },
  { value: 'BAR', label: 'Bar chart' },
  { value: 'NUMBER', label: 'Single number' },
  { value: 'TABLE', label: 'Table' },
];
