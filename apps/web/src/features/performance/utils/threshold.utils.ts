import { FAILURE_LIMITS, LATENCY_LIMITS, type LatencyLimits } from '../constants/threshold.constants';
import type { Severity } from '../types/performance.types';

export class ThresholdUtils {
  static limitsFor(op: string): LatencyLimits | null {
    return LATENCY_LIMITS.find((limits) => op === limits.prefix || op.startsWith(`${limits.prefix}.`)) ?? null;
  }

  static latency(ms: number | null | undefined, op: string): Severity {
    if (ms === null || ms === undefined) return 'good';
    const limits = ThresholdUtils.limitsFor(op);
    if (!limits) return 'good';
    if (ms >= limits.criticalMs) return 'critical';
    if (ms >= limits.warningMs) return 'warning';
    return 'good';
  }

  static failure(rate: number): Severity {
    if (rate >= FAILURE_LIMITS.criticalRate) return 'critical';
    if (rate >= FAILURE_LIMITS.warningRate) return 'warning';
    return 'good';
  }
}
