import type { MetricType } from '../../generated/prisma/enums';

export type RangeKey = '1h' | '24h' | '7d' | '30d';
export type Aggregation = 'AVG' | 'SUM' | 'MIN' | 'MAX' | 'COUNT' | 'P50' | 'P95' | 'P99';
export type SeriesSource = 'METRIC' | 'TRANSACTIONS';
export type WidgetDisplayKind = 'LINE' | 'BAR' | 'NUMBER';

export interface SpanInput {
  spanId: string;
  parentSpanId?: string;
  op: string;
  description?: string;
  startOffsetMs: number;
  durationMs: number;
  status: string;
}

export interface TransactionInput {
  eventId: string;
  traceId: string;
  name: string;
  op: string;
  status: string;
  timestamp: Date;
  durationMs: number;
  release?: string;
  environment?: string;
  spans: SpanInput[];
  tags: Record<string, string>;
}

export interface MetricInput {
  name: string;
  type: MetricType;
  value: number;
  unit?: string;
  tags: Record<string, string>;
  release?: string;
  environment?: string;
  timestamp: Date;
}

export interface SeriesQuery {
  projectId: string;
  source: SeriesSource;
  name?: string;
  aggregation: Aggregation;
  from: Date;
  bucket: string;
  environment?: string;
}

export interface SeriesPoint {
  timestamp: string;
  value: number | null;
}

export interface SeriesView {
  points: SeriesPoint[];
  total: number | null;
  bucketMs: number;
}

export interface TransactionSummaryRow {
  name: string;
  op: string;
  count: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  failureRate: number;
}

export interface TransactionView {
  id: string;
  eventId: string;
  traceId: string;
  name: string;
  op: string;
  status: string;
  timestamp: string;
  durationMs: number;
  release: string | null;
  environment: string | null;
  spans: SpanInput[];
  tags: Record<string, string>;
}

export interface MetricNameView {
  name: string;
  type: MetricType;
  unit: string | null;
  samples: number;
}

export interface WidgetView {
  id: string;
  title: string;
  source: SeriesSource;
  metricName: string | null;
  filterName: string | null;
  aggregation: Aggregation;
  display: WidgetDisplayKind;
  position: number;
}

export interface DashboardView {
  id: string;
  projectId: string;
  name: string;
  widgets: WidgetView[];
  createdAt: string;
}

export interface PerformancePage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
