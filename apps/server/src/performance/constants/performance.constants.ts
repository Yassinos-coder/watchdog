export const MAX_SPANS = 200;
export const MAX_SPAN_NAME_LENGTH = 300;
export const MAX_TRANSACTION_NAME_LENGTH = 200;
export const MAX_METRICS_PER_REQUEST = 500;
export const MAX_METRIC_NAME_LENGTH = 120;
export const MAX_TAG_COUNT = 30;
export const MAX_TAG_LENGTH = 200;
export const MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000;
export const METRIC_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.\-/]*$/;
export const TRACE_ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;
export const METRIC_TYPES = ['COUNTER', 'GAUGE', 'DISTRIBUTION'] as const;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_WIDGETS_PER_DASHBOARD = 24;
export const DASHBOARD_COLUMNS = 12;
export const MIN_WIDGET_WIDTH = 3;
export const MIN_WIDGET_HEIGHT = 3;
export const MAX_WIDGET_HEIGHT = 20;
export const MAX_WIDGET_ROW = 999;
export const NEW_WIDGET_WIDTH = 6;
export const NEW_WIDGET_HEIGHT = 4;
export const MAX_DASHBOARDS_PER_PROJECT = 20;

export const RANGES = {
  '1h': { ms: 60 * 60 * 1000, bucket: '1 minute', bucketMs: 60_000 },
  '24h': { ms: 24 * 60 * 60 * 1000, bucket: '1 hour', bucketMs: 3_600_000 },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, bucket: '6 hours', bucketMs: 6 * 3_600_000 },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, bucket: '1 day', bucketMs: 86_400_000 },
  '90d': { ms: 90 * 24 * 60 * 60 * 1000, bucket: '1 day', bucketMs: 86_400_000 },
} as const;

export const RANGE_KEYS = ['1h', '24h', '7d', '30d', '90d'] as const;
export const ROLLUP_RANGE_KEYS = ['7d', '30d', '90d'] as const;
export const AGGREGATIONS = ['AVG', 'SUM', 'MIN', 'MAX', 'COUNT', 'P50', 'P95', 'P99', 'RATE'] as const;
export const SERIES_SOURCES = ['METRIC', 'TRANSACTIONS', 'ERRORS'] as const;
export const ERROR_AGGREGATIONS = ['COUNT', 'RATE'] as const;
export const WIDGET_DISPLAYS = ['LINE', 'BAR', 'NUMBER', 'TABLE'] as const;
export const MAX_GROUPS = 8;
export const MAX_TAG_KEY_LENGTH = 100;
export const NO_GROUP_LABEL = '(none)';
export const TAG_KEY_SAMPLE_ROWS = 1000;
export const TAG_KEY_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_TAG_KEYS_LISTED = 50;
export const MAX_TAG_VALUES_LISTED = 25;

export const ROLLUP_HOUR_MS = 3_600_000;
export const ROLLUP_REFRESH_OVERLAP_HOURS = 2;
export const ROLLUP_CHUNK_HOURS = 24;
export const ROLLUP_INTERVAL_MS = 5 * 60_000;
export const ROLLUP_STARTUP_DELAY_MS = 30_000;
