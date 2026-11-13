import type { AlertTrigger } from '../../generated/prisma/enums';
import { AlertMessage, MetricAlertDetail } from '../interfaces/alert.interfaces';
import { IssueWithProject } from '../repositories/alert-delivery.repository';

export class AlertMessageMapper {
  static fromIssue(
    trigger: AlertTrigger,
    reason: string,
    issue: IssueWithProject,
    appUrl: string,
    context: { environment: string | null; release: string | null },
  ): AlertMessage {
    return {
      trigger,
      reason,
      title: issue.title,
      culprit: issue.culprit,
      projectName: issue.project.name,
      level: issue.level,
      environment: context.environment,
      release: context.release ?? issue.lastRelease,
      eventCount: issue.eventCount,
      issueUrl: `${appUrl}/projects/${issue.projectId}/issues/${issue.id}`,
    };
  }

  static fromMetric(
    detail: MetricAlertDetail,
    context: { projectId: string; projectName: string; environment: string | null; appUrl: string },
  ): AlertMessage {
    return {
      trigger: 'METRIC',
      reason: AlertMessageMapper.reason('METRIC'),
      title: AlertMessageMapper.metricTitle(detail),
      culprit: null,
      projectName: context.projectName,
      level: 'warning',
      environment: context.environment,
      release: null,
      eventCount: 0,
      issueUrl: `${context.appUrl}/projects/${context.projectId}/dashboards`,
      metric: detail,
    };
  }

  static metricTitle(detail: MetricAlertDetail): string {
    const direction = detail.comparator === 'ABOVE' ? 'above' : 'below';
    const aggregation = detail.aggregation.toLowerCase();
    const value = AlertMessageMapper.number(detail.value);
    const threshold = AlertMessageMapper.number(detail.threshold);
    return `${detail.name} ${aggregation} is ${value}, ${direction} ${threshold} over ${detail.windowMins} min`;
  }

  static number(value: number): string {
    return String(Number(value.toFixed(2)));
  }

  static sample(appUrl: string): AlertMessage {
    return {
      trigger: 'NEW_ISSUE',
      reason: 'Test alert from Watchdog',
      title: 'TypeError: Cannot read properties of undefined (reading \'price\')',
      culprit: 'OrdersController.checkout (src/orders/orders.controller.ts:41)',
      projectName: 'Example project',
      level: 'error',
      environment: 'production',
      release: '1.0.0',
      eventCount: 1,
      issueUrl: appUrl,
    };
  }

  static reason(trigger: AlertTrigger, spike?: { count: number; windowMins: number }): string {
    if (trigger === 'REGRESSION') {
      return 'Issue regressed';
    }
    if (trigger === 'METRIC') {
      return 'Metric alert';
    }
    if (trigger === 'SPIKE' && spike) {
      return `Spike: ${spike.count} events in ${spike.windowMins} min`;
    }
    return 'New issue';
  }
}
