import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT } from '../constants/mcp.constants';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class McpToolError extends Error {}

export class McpArgsValidator {
  static uuid(args: Record<string, unknown>, key: string): string {
    const value = args[key];
    if (typeof value !== 'string' || !UUID.test(value)) {
      throw new McpToolError(`"${key}" must be an id. Use list_projects or list_issues to find one.`);
    }
    return value;
  }

  static text(args: Record<string, unknown>, key: string, max = 200): string | undefined {
    const value = args[key];
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value !== 'string' || value.length > max) {
      throw new McpToolError(`"${key}" must be text of at most ${max} characters`);
    }
    return value;
  }

  static choice<T extends string>(args: Record<string, unknown>, key: string, allowed: readonly T[]): T | undefined {
    const value = args[key];
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
      throw new McpToolError(`"${key}" must be one of: ${allowed.join(', ')}`);
    }
    return value as T;
  }

  static requiredChoice<T extends string>(args: Record<string, unknown>, key: string, allowed: readonly T[]): T {
    const value = McpArgsValidator.choice(args, key, allowed);
    if (value === undefined) {
      throw new McpToolError(`"${key}" is required and must be one of: ${allowed.join(', ')}`);
    }
    return value;
  }

  static limit(args: Record<string, unknown>): number {
    const value = args.limit;
    if (value === undefined || value === null) {
      return DEFAULT_LIST_LIMIT;
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      throw new McpToolError('"limit" must be a positive whole number');
    }
    return Math.min(value, MAX_LIST_LIMIT);
  }
}
