import { EventView, IssueView } from '../../issues/interfaces/issue.interfaces';

const MAX_FRAMES = 40;
const MAX_BREADCRUMBS = 40;

interface PayloadFrame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  inApp?: boolean;
  symbolicated?: boolean;
  contextLine?: string;
  preContext?: string[];
  postContext?: string[];
}

interface Payload {
  exception?: { type?: string; value?: string; handled?: boolean; frames?: PayloadFrame[] };
  breadcrumbs?: unknown[];
  request?: unknown;
  user?: unknown;
  tags?: unknown;
  extra?: unknown;
  contexts?: unknown;
  sdk?: unknown;
}

export class McpDebugMapper {
  static issue(issue: IssueView, appUrl: string): Record<string, unknown> {
    return {
      id: issue.id,
      projectId: issue.projectId,
      title: issue.title,
      culprit: issue.culprit,
      level: issue.level,
      status: issue.status,
      platform: issue.platform,
      firstSeen: issue.firstSeen,
      lastSeen: issue.lastSeen,
      eventCount: issue.eventCount,
      firstRelease: issue.firstRelease,
      lastRelease: issue.lastRelease,
      regressedAt: issue.regressedAt,
      url: `${appUrl}/projects/${issue.projectId}/issues/${issue.id}`,
    };
  }

  static eventSummary(event: EventView): Record<string, unknown> {
    return {
      id: event.id,
      timestamp: event.timestamp,
      level: event.level,
      message: event.message,
      release: event.release,
      environment: event.environment,
    };
  }

  static debug(issue: IssueView, event: EventView | null, appUrl: string): Record<string, unknown> {
    return {
      issue: McpDebugMapper.issue(issue, appUrl),
      event: event ? McpDebugMapper.event(event) : null,
      howToRead: [
        'exception.frames lists the newest call first, so the first frame is where the error was thrown.',
        'Frames with symbolicated=true point at your original source files through the uploaded source maps. Open frame.file in the repository at frame.line.',
        'frame.code shows the surrounding source lines; ">" marks the failing line. inApp=false frames are libraries.',
        'breadcrumbs run oldest to newest and end with what happened just before the error.',
      ],
    };
  }

  private static event(event: EventView): Record<string, unknown> {
    const payload = (event.payload ?? {}) as Payload;
    return {
      ...McpDebugMapper.eventSummary(event),
      eventId: event.eventId,
      platform: event.platform,
      exception: McpDebugMapper.exception(payload),
      breadcrumbs: (payload.breadcrumbs ?? []).slice(-MAX_BREADCRUMBS),
      request: payload.request ?? null,
      user: payload.user ?? null,
      tags: payload.tags ?? {},
      extra: payload.extra ?? {},
      contexts: payload.contexts ?? {},
      sdk: payload.sdk ?? null,
    };
  }

  private static exception(payload: Payload): Record<string, unknown> | null {
    const exception = payload.exception;
    if (!exception) {
      return null;
    }
    const frames = [...(exception.frames ?? [])].reverse();
    return {
      type: exception.type,
      value: exception.value,
      handled: exception.handled,
      frames: frames.slice(0, MAX_FRAMES).map(McpDebugMapper.frame),
      hiddenFrames: Math.max(frames.length - MAX_FRAMES, 0),
    };
  }

  private static frame(frame: PayloadFrame): Record<string, unknown> {
    return {
      file: frame.filename,
      function: frame.function,
      line: frame.lineno,
      column: frame.colno,
      inApp: frame.inApp === true,
      symbolicated: frame.symbolicated === true,
      code: McpDebugMapper.code(frame),
    };
  }

  private static code(frame: PayloadFrame): string[] | undefined {
    if (frame.contextLine === undefined || frame.lineno === undefined) {
      return undefined;
    }
    const before = frame.preContext ?? [];
    const after = frame.postContext ?? [];
    const first = frame.lineno - before.length;
    const numbered = (line: string, number: number, marker: string): string => `${marker} ${number} | ${line}`;
    return [
      ...before.map((line, index) => numbered(line, first + index, ' ')),
      numbered(frame.contextLine, frame.lineno, '>'),
      ...after.map((line, index) => numbered(line, frame.lineno! + 1 + index, ' ')),
    ];
  }
}
