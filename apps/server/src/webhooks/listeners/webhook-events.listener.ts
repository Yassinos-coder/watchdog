import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ALERT_TRIGGERED, ISSUE_EVENT_RECORDED } from '../../alerts/constants/alert.constants';
import { IssueSignal } from '../../alerts/interfaces/alert.interfaces';
import { IssuesService } from '../../issues/services/issues.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { AlertTriggeredSignal } from '../interfaces/webhook.interfaces';
import { WebhookDispatcher } from '../services/webhook-dispatcher.service';

@Injectable()
export class WebhookEventsListener {
  private readonly logger = new Logger(WebhookEventsListener.name);

  constructor(
    private readonly dispatcher: WebhookDispatcher,
    private readonly issuesService: IssuesService,
    private readonly projectsService: ProjectsService,
  ) {}

  @OnEvent(ISSUE_EVENT_RECORDED, { async: true })
  async onIssue(signal: IssueSignal): Promise<void> {
    if (!signal.isNewIssue && !signal.isRegression) {
      return;
    }
    try {
      const [{ issue }, project] = await Promise.all([
        this.issuesService.getDetail(signal.issueId),
        this.projectsService.get(signal.projectId),
      ]);
      await this.dispatcher.emit(signal.isNewIssue ? 'issue.new' : 'issue.regression', {
        project: { id: project.id, name: project.name },
        issue: {
          id: issue.id,
          title: issue.title,
          culprit: issue.culprit,
          level: issue.level,
          status: issue.status,
          eventCount: issue.eventCount,
        },
        environment: signal.environment,
        release: signal.release,
      });
    } catch (error) {
      this.logger.error(`Could not prepare an issue webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @OnEvent(ALERT_TRIGGERED, { async: true })
  async onAlert(signal: AlertTriggeredSignal): Promise<void> {
    try {
      const project = await this.projectsService.get(signal.projectId);
      await this.dispatcher.emit(signal.type, {
        project: { id: project.id, name: project.name },
        rule: signal.rule,
        ...signal.data,
      });
    } catch (error) {
      this.logger.error(`Could not prepare an alert webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
