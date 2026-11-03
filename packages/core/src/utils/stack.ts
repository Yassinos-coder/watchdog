import { Frame } from '../interfaces';

const V8_FRAME = /^\s*at (?:(.+?) )?\(?(.+?):(\d+):(\d+)\)?\s*$/;
const GECKO_FRAME = /^\s*(.*?)(?:\/<)*@(.+?):(\d+):(?::?(\d+))?\s*$/;
const VENDOR_PATTERN = /node_modules|^node:|\/\.vite\/|webpack\/runtime/;
const NATIVE_PATTERN = /^(native|<anonymous>|eval)$/;
const HERMES_ADDRESS_PREFIX = /^address at /;
const MAX_FRAMES = 100;

export class StackParser {
  static parse(stack: string | undefined): Frame[] {
    if (!stack) {
      return [];
    }
    const frames: Frame[] = [];
    for (const line of stack.split('\n')) {
      const frame = StackParser.parseLine(line);
      if (frame) {
        frames.push(frame);
      }
    }
    return frames.reverse().slice(-MAX_FRAMES);
  }

  static isVendor(filename: string | undefined): boolean {
    return filename === undefined || VENDOR_PATTERN.test(filename);
  }

  private static parseLine(line: string): Frame | null {
    const match = V8_FRAME.exec(line) ?? GECKO_FRAME.exec(line);
    if (!match) {
      return null;
    }
    const [, rawFunction, rawFilename, lineno, colno] = match;
    const filename = rawFilename.replace(HERMES_ADDRESS_PREFIX, '');
    if (NATIVE_PATTERN.test(filename)) {
      return null;
    }
    return {
      function: StackParser.cleanFunction(rawFunction),
      filename,
      lineno: Number(lineno),
      colno: colno ? Number(colno) : undefined,
      inApp: !StackParser.isVendor(filename),
    };
  }

  private static cleanFunction(name: string | undefined): string | undefined {
    if (!name) {
      return undefined;
    }
    const cleaned = name.replace(/^async\s+/, '').replace(/^new\s+/, '').trim();
    return cleaned && cleaned !== '<anonymous>' ? cleaned : undefined;
  }
}
