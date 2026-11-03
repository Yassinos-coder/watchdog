const MAX_DEPTH = 2;
const MAX_KEYS = 8;
const MAX_ITEMS = 5;
const MAX_STRING = 80;
const DEFAULT_MAX_LENGTH = 300;

export class SafeFormat {
  static describe(value: unknown, maxLength = DEFAULT_MAX_LENGTH): string {
    try {
      if (typeof value === 'string') {
        return value.slice(0, maxLength);
      }
      return SafeFormat.render(value, 0).slice(0, maxLength);
    } catch {
      return '[unprintable]';
    }
  }

  private static render(value: unknown, depth: number): string {
    if (value === null || value === undefined) {
      return String(value);
    }
    switch (typeof value) {
      case 'string':
        return JSON.stringify(value.slice(0, MAX_STRING));
      case 'number':
      case 'boolean':
      case 'bigint':
        return String(value);
      case 'symbol':
        return value.toString();
      case 'function':
        return `[Function ${value.name || 'anonymous'}]`;
      default:
        return SafeFormat.renderObject(value as object, depth);
    }
  }

  private static renderObject(value: object, depth: number): string {
    if (value instanceof Error) {
      return `${value.name}: ${value.message}`;
    }
    const node = value as { nodeType?: unknown; nodeName?: unknown };
    if (typeof node.nodeType === 'number') {
      return `[${String(node.nodeName)}]`;
    }
    if (Array.isArray(value)) {
      return SafeFormat.renderArray(value, depth);
    }
    const name = Object.getPrototypeOf(value)?.constructor?.name ?? 'Object';
    if (depth >= MAX_DEPTH) {
      return `[${name}]`;
    }
    const parts: string[] = [];
    let seen = 0;
    for (const key in value) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        continue;
      }
      if (seen === MAX_KEYS) {
        parts.push('…');
        break;
      }
      seen += 1;
      parts.push(`${key}:${SafeFormat.render((value as Record<string, unknown>)[key], depth + 1)}`);
    }
    return name === 'Object' ? `{${parts.join(',')}}` : `${name}{${parts.join(',')}}`;
  }

  private static renderArray(value: unknown[], depth: number): string {
    if (depth >= MAX_DEPTH) {
      return `[Array(${value.length})]`;
    }
    const items = value.slice(0, MAX_ITEMS).map((item) => SafeFormat.render(item, depth + 1));
    const rest = value.length > MAX_ITEMS ? `,…${value.length - MAX_ITEMS} more` : '';
    return `[${items.join(',')}${rest}]`;
  }
}
