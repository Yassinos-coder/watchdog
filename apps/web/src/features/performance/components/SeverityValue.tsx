import { CircleAlert, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FAILURE_LABELS, LATENCY_LABELS } from '../constants/threshold.constants';
import type { Severity } from '../types/performance.types';
import { PerformanceUtils } from '../utils/performance.utils';
import { ThresholdUtils } from '../utils/threshold.utils';

interface SeverityValueProps {
  severity: Severity;
  label: string;
  children: ReactNode;
  className?: string;
}

export function SeverityValue({ severity, label, children, className }: SeverityValueProps) {
  if (severity === 'good') {
    return <span className={className}>{children}</span>;
  }
  const Icon = severity === 'critical' ? CircleAlert : TriangleAlert;
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center justify-end gap-1',
        severity === 'critical' ? 'font-semibold text-destructive' : 'font-medium text-warning-text',
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
      <span className="sr-only"> ({label})</span>
    </span>
  );
}

interface LatencyValueProps {
  ms: number | null | undefined;
  op: string;
  className?: string;
}

export function LatencyValue({ ms, op, className }: LatencyValueProps) {
  const severity = ThresholdUtils.latency(ms, op);
  return (
    <SeverityValue severity={severity} label={LATENCY_LABELS[severity]} className={className}>
      {PerformanceUtils.duration(ms)}
    </SeverityValue>
  );
}

export function FailureValue({ rate }: { rate: number }) {
  if (rate <= 0) {
    return <span className="text-muted-foreground">0%</span>;
  }
  const severity = ThresholdUtils.failure(rate);
  return (
    <SeverityValue severity={severity} label={FAILURE_LABELS[severity]}>
      {PerformanceUtils.percent(rate)}
    </SeverityValue>
  );
}
