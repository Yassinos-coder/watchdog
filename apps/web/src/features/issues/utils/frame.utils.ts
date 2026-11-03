import type { CodeLine, StackFrame } from '../types/issue.types';

export class FrameUtils {
  static newestFirst(frames: StackFrame[]): StackFrame[] {
    return [...frames].reverse();
  }

  static headline(frames: StackFrame[]): StackFrame | undefined {
    const newest = FrameUtils.newestFirst(frames);
    return newest.find((frame) => frame.inApp === true && FrameUtils.hasContext(frame)) ??
      newest.find((frame) => frame.inApp === true) ??
      newest[0];
  }

  static hasContext(frame: StackFrame): boolean {
    return frame.contextLine !== undefined;
  }

  static toCodeLines(frame: StackFrame): CodeLine[] {
    if (frame.contextLine === undefined || frame.lineno === undefined) {
      return [];
    }
    const pre = frame.preContext ?? [];
    const post = frame.postContext ?? [];
    return [
      ...pre.map((text, index) => ({ number: frame.lineno! - pre.length + index, text })),
      { number: frame.lineno, text: frame.contextLine, failing: true },
      ...post.map((text, index) => ({ number: frame.lineno! + index + 1, text })),
    ];
  }

  static location(frame: StackFrame): string {
    const file = frame.filename ?? '<unknown>';
    if (frame.lineno === undefined) {
      return file;
    }
    return frame.colno === undefined ? `${file}:${frame.lineno}` : `${file}:${frame.lineno}:${frame.colno}`;
  }

  static displayName(frame: StackFrame): string {
    return frame.function ?? '<anonymous>';
  }
}
