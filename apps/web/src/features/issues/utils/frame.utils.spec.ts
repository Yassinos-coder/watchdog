import { describe, expect, it } from 'vitest';
import type { StackFrame } from '../types/issue.types';
import { FrameUtils } from './frame.utils';

const frame = (overrides: Partial<StackFrame>): StackFrame => ({
  filename: 'src/app.ts',
  function: 'run',
  lineno: 10,
  inApp: true,
  ...overrides,
});

describe('FrameUtils.toCodeLines', () => {
  it('numbers lines around the failing line', () => {
    const lines = FrameUtils.toCodeLines(
      frame({ lineno: 10, preContext: ['a', 'b'], contextLine: 'boom', postContext: ['c'] }),
    );

    expect(lines).toEqual([
      { number: 8, text: 'a' },
      { number: 9, text: 'b' },
      { number: 10, text: 'boom', failing: true },
      { number: 11, text: 'c' },
    ]);
  });

  it('returns nothing without source context', () => {
    expect(FrameUtils.toCodeLines(frame({}))).toEqual([]);
    expect(FrameUtils.toCodeLines(frame({ contextLine: 'x', lineno: undefined }))).toEqual([]);
  });

  it('keeps the indentation of every line', () => {
    const [pre, failing] = FrameUtils.toCodeLines(
      frame({ preContext: ['  if (ok) {'], contextLine: '    return total;' }),
    );

    expect(pre.text).toBe('  if (ok) {');
    expect(failing.text).toBe('    return total;');
  });
});

describe('FrameUtils.headline', () => {
  it('prefers the newest in-app frame that has source context', () => {
    const frames = [
      frame({ function: 'entry', contextLine: 'entry()' }),
      frame({ function: 'noContext' }),
      frame({ function: 'vendor', inApp: false, contextLine: 'x' }),
    ];

    expect(FrameUtils.headline(frames)?.function).toBe('entry');
  });

  it('falls back to the newest in-app frame, then to the newest frame', () => {
    expect(FrameUtils.headline([frame({ function: 'older' }), frame({ function: 'newer' })])?.function).toBe('newer');
    expect(FrameUtils.headline([frame({ function: 'lib', inApp: false })])?.function).toBe('lib');
    expect(FrameUtils.headline([])).toBeUndefined();
  });
});

describe('FrameUtils labels', () => {
  it('formats locations and names', () => {
    expect(FrameUtils.location(frame({ colno: 4 }))).toBe('src/app.ts:10:4');
    expect(FrameUtils.location(frame({ lineno: undefined }))).toBe('src/app.ts');
    expect(FrameUtils.displayName(frame({ function: undefined }))).toBe('<anonymous>');
  });
});
