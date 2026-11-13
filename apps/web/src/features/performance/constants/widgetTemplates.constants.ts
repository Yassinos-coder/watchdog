import type {
  Aggregation,
  MockShape,
  SeriesSource,
  WidgetDisplay,
} from '../types/performance.types';

export interface WidgetTemplate {
  id: string;
  title: string;
  description: string;
  source: SeriesSource;
  aggregation: Aggregation;
  display: WidgetDisplay;
  mock: MockShape;
  mockNumber: string;
  live: boolean;
  needsSetup: boolean;
  unit: 'count' | 'duration' | 'rate';
}

export const READY_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'errors',
    title: 'Errors',
    description: 'How many errors your app reported over time.',
    source: 'ERRORS',
    aggregation: 'COUNT',
    display: 'BAR',
    mock: 'spiky',
    mockNumber: '24',
    live: true,
    needsSetup: false,
    unit: 'count',
  },
  {
    id: 'requests',
    title: 'Requests',
    description: 'How many transactions ran, such as requests or jobs.',
    source: 'TRANSACTIONS',
    aggregation: 'COUNT',
    display: 'BAR',
    mock: 'wave',
    mockNumber: '1,284',
    live: true,
    needsSetup: false,
    unit: 'count',
  },
  {
    id: 'p95',
    title: 'Response time (p95)',
    description: 'The time 95% of transactions finish within. Spots slow tails.',
    source: 'TRANSACTIONS',
    aggregation: 'P95',
    display: 'LINE',
    mock: 'wave',
    mockNumber: '420 ms',
    live: true,
    needsSetup: false,
    unit: 'duration',
  },
  {
    id: 'average',
    title: 'Average response time',
    description: 'One number for how fast your app answers right now.',
    source: 'TRANSACTIONS',
    aggregation: 'AVG',
    display: 'NUMBER',
    mock: 'steady',
    mockNumber: '186 ms',
    live: true,
    needsSetup: false,
    unit: 'duration',
  },
];

export const CUSTOM_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'metric',
    title: 'Custom metric',
    description: 'Chart any metric you send, such as queue depth or cart value.',
    source: 'METRIC',
    aggregation: 'AVG',
    display: 'LINE',
    mock: 'rising',
    mockNumber: '42',
    live: false,
    needsSetup: true,
    unit: 'count',
  },
  {
    id: 'split',
    title: 'Metric split by tag',
    description: 'One line per tag value, like calls per minute by tier or language.',
    source: 'METRIC',
    aggregation: 'SUM',
    display: 'LINE',
    mock: 'wave',
    mockNumber: '96',
    live: false,
    needsSetup: true,
    unit: 'count',
  },
  {
    id: 'rate',
    title: 'Rate per second',
    description: 'How often a counter such as calls.started grows each second.',
    source: 'METRIC',
    aggregation: 'RATE',
    display: 'LINE',
    mock: 'steady',
    mockNumber: '0.8/s',
    live: false,
    needsSetup: true,
    unit: 'rate',
  },
  {
    id: 'table',
    title: 'Table by tag',
    description: 'Rank tag values side by side, for example latency per language.',
    source: 'METRIC',
    aggregation: 'P95',
    display: 'TABLE',
    mock: 'steady',
    mockNumber: '',
    live: false,
    needsSetup: true,
    unit: 'duration',
  },
];

export const MOCK_TABLE_ROWS = [
  { key: 'en', value: '310 ms' },
  { key: 'fr', value: '280 ms' },
  { key: 'es', value: '240 ms' },
];
