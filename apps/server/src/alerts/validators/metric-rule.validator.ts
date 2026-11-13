import type { AlertRule } from '../../generated/prisma/client';
import type { MetricComparator } from '../../generated/prisma/enums';
import { MetricRuleSpec } from '../interfaces/alert.interfaces';

type MetricRuleFields = Pick<
  AlertRule,
  'metricSource' | 'metricName' | 'metricAggregation' | 'metricComparator' | 'metricThreshold' | 'metricWindowMins'
>;

export class MetricRuleValidator {
  static isComplete(rule: MetricRuleFields): boolean {
    if (!rule.metricSource || !rule.metricAggregation || !rule.metricComparator) {
      return false;
    }
    if (rule.metricThreshold === null || !rule.metricWindowMins) {
      return false;
    }
    return rule.metricSource === 'TRANSACTIONS' || Boolean(rule.metricName);
  }

  static toSpec(rule: AlertRule): MetricRuleSpec | null {
    if (!MetricRuleValidator.isComplete(rule)) {
      return null;
    }
    return {
      source: rule.metricSource!,
      name: rule.metricName,
      aggregation: rule.metricAggregation!,
      comparator: rule.metricComparator!,
      threshold: rule.metricThreshold!,
      windowMins: rule.metricWindowMins!,
      tagKey: rule.metricTagKey,
      tagValue: rule.metricTagKey ? rule.metricTagValue : null,
    };
  }

  static isBreached(comparator: MetricComparator, value: number, threshold: number): boolean {
    return comparator === 'ABOVE' ? value > threshold : value < threshold;
  }
}
