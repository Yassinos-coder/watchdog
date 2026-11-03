import type { RequestContext } from '@watchdog-sdk/core';
import { HttpRequestLike } from './interfaces';

const SAFE_HEADERS = new Set([
  'user-agent',
  'referer',
  'content-type',
  'content-length',
  'accept',
  'accept-language',
  'host',
  'x-request-id',
]);

export class RequestContextBuilder {
  static from(request: HttpRequestLike): RequestContext {
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(request.headers ?? {})) {
      if (SAFE_HEADERS.has(name.toLowerCase()) && value !== undefined) {
        headers[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
      }
    }
    return {
      url: RequestContextBuilder.stripQuery(request.originalUrl ?? request.url),
      method: request.method,
      headers,
    };
  }

  private static stripQuery(url: string | undefined): string | undefined {
    return url?.split('?')[0];
  }
}
