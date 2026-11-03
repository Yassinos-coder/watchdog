import type { Event, Issue } from '../../generated/prisma/client';
import { EventView, IssueView } from '../interfaces/issue.interfaces';

export class IssueMapper {
  static toView(issue: Issue): IssueView {
    return {
      id: issue.id,
      projectId: issue.projectId,
      title: issue.title,
      culprit: issue.culprit,
      level: issue.level,
      platform: issue.platform,
      status: issue.status,
      firstSeen: issue.firstSeen,
      lastSeen: issue.lastSeen,
      eventCount: issue.eventCount,
      firstRelease: issue.firstRelease,
      lastRelease: issue.lastRelease,
      regressedAt: issue.regressedAt,
    };
  }

  static toEventView(event: Event): EventView {
    return {
      id: event.id,
      eventId: event.eventId,
      issueId: event.issueId,
      timestamp: event.timestamp,
      level: event.level,
      message: event.message,
      release: event.release,
      environment: event.environment,
      platform: event.platform,
      payload: event.payload,
    };
  }
}
