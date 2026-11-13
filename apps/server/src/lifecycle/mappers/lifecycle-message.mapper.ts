import { AlertMessage } from '../../alerts/interfaces/alert.interfaces';
import {
  LIVE_WINDOW_MS,
  MAX_PROJECTS_LISTED,
  TONE_BAD,
  TONE_GOOD,
} from '../constants/lifecycle.constants';
import { OnlineContext, ProjectActivity } from '../interfaces/lifecycle.interfaces';
import { LifecycleUtils } from '../utils/lifecycle.utils';

export class LifecycleMessageMapper {
  static stopping(appUrl: string): AlertMessage {
    return LifecycleMessageMapper.notice('🔴 Watchdog is restarting', TONE_BAD, appUrl, [
      'Watchdog is shutting down for an update or restart.',
      'Error and metric collection pause until it is back.',
      'I will message you here as soon as it is online again.',
    ]);
  }

  static online(context: OnlineContext): AlertMessage {
    const lines = [
      ...LifecycleMessageMapper.summary(context),
      ...LifecycleMessageMapper.projects(context),
    ];
    return LifecycleMessageMapper.notice('🟢 Watchdog is online', TONE_GOOD, context.appUrl, lines);
  }

  private static summary(context: OnlineContext): string[] {
    const downtime = LifecycleUtils.downtimeMs(context.previous, context.bootedAt);
    const updated = context.previous !== null && context.previous.version !== context.version;
    return [
      updated
        ? `Updated from ${context.previous?.version} to ${context.version}.`
        : `Version ${context.version}.`,
      ...(downtime === null ? [] : [`It was away for about ${LifecycleUtils.span(downtime)}.`]),
    ];
  }

  private static projects(context: OnlineContext): string[] {
    if (context.projects.length === 0) {
      return [];
    }
    const listed = context.projects.slice(0, MAX_PROJECTS_LISTED);
    const hidden = context.projects.length - listed.length;
    return [
      '',
      'Apps being watched:',
      ...listed.map((project) => LifecycleMessageMapper.project(project, context.now)),
      ...(hidden > 0 ? [`…and ${hidden} more`] : []),
      '',
      'A white dot means no data lately, not that the app is down. Quiet apps send nothing.',
    ];
  }

  private static project(project: ProjectActivity, now: Date): string {
    if (!project.lastSeen) {
      return `⚪ ${project.name}: no data in the last 7 days`;
    }
    const age = Math.max(now.getTime() - project.lastSeen.getTime(), 0);
    const live = age <= LIVE_WINDOW_MS;
    return `${live ? '🟢' : '⚪'} ${project.name}: last data ${LifecycleUtils.span(age)} ago`;
  }

  private static notice(reason: string, tone: string, url: string, lines: string[]): AlertMessage {
    return {
      trigger: 'SYSTEM',
      reason,
      title: reason,
      culprit: null,
      projectName: 'Watchdog',
      level: 'info',
      environment: null,
      release: null,
      eventCount: 0,
      issueUrl: url,
      notice: { tone, lines },
    };
  }
}
