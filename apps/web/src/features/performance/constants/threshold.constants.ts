export interface LatencyLimits {
  prefix: string;
  warningMs: number;
  criticalMs: number;
}

export const LATENCY_LIMITS: LatencyLimits[] = [
  { prefix: 'http.server', warningMs: 500, criticalMs: 1_500 },
  { prefix: 'http', warningMs: 800, criticalMs: 3_000 },
  { prefix: 'db', warningMs: 100, criticalMs: 500 },
  { prefix: 'cache', warningMs: 20, criticalMs: 100 },
  { prefix: 'ui', warningMs: 1_000, criticalMs: 3_000 },
];

export const FAILURE_LIMITS = { warningRate: 0.01, criticalRate: 0.05 };

export const LATENCY_LABELS = { good: 'Fast enough', warning: 'Slow', critical: 'Very slow' } as const;
export const FAILURE_LABELS = { good: 'Low failure rate', warning: 'Elevated failure rate', critical: 'High failure rate' } as const;
