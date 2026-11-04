export type PerfRange = '1h' | '24h' | '7d' | '30d';
export type Aggregation = 'AVG' | 'SUM' | 'MIN' | 'MAX' | 'COUNT' | 'P50' | 'P95' | 'P99';
export type SeriesSource = 'METRIC' | 'TRANSACTIONS';
export type WidgetDisplay = 'LINE' | 'BAR' | 'NUMBER';
export type Severity = 'good' | 'warning' | 'critical';

export interface TransactionSummary {
  name: string;
  op: string;
  count: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  failureRate: number;
}

export interface Span {
  spanId: string;
  parentSpanId?: string;
  op: string;
  description?: string;
  startOffsetMs: number;
  durationMs: number;
  status: string;
}

export interface Transaction {
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
  spans: Span[];
  tags: Record<string, string>;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MetricName {
  name: string;
  type: 'COUNTER' | 'GAUGE' | 'DISTRIBUTION';
  unit: string | null;
  samples: number;
}

export interface SeriesPoint {
  timestamp: string;
  value: number | null;
}

export interface Series {
  points: SeriesPoint[];
  total: number | null;
  bucketMs: number;
}

export interface SeriesParams {
  source: SeriesSource;
  name?: string;
  aggregation: Aggregation;
  range: PerfRange;
}

export interface Widget {
  id: string;
  title: string;
  source: SeriesSource;
  metricName: string | null;
  filterName: string | null;
  aggregation: Aggregation;
  display: WidgetDisplay;
  position: number;
}

export interface Dashboard {
  id: string;
  projectId: string;
  name: string;
  widgets: Widget[];
  createdAt: string;
}

export interface WidgetInput {
  title: string;
  source: SeriesSource;
  metricName?: string;
  filterName?: string;
  aggregation: Aggregation;
  display: WidgetDisplay;
}
