const SENSITIVE_PARAMS = new Set(['key', 'token', 'code', 'password', 'secret', 'authorization']);
const QUIET_PATHS = ['/ingest/', '/health/'];
const REDACTED = '[redacted]';
const PLACEHOLDER_ORIGIN = 'http://placeholder.local';

export class RequestLogUtils {
  static safeUrl(originalUrl: string): string {
    const url = new URL(originalUrl, PLACEHOLDER_ORIGIN);
    for (const name of [...url.searchParams.keys()]) {
      if (SENSITIVE_PARAMS.has(name.toLowerCase())) {
        url.searchParams.set(name, REDACTED);
      }
    }
    return `${url.pathname}${url.search ? decodeURIComponent(url.search) : ''}`;
  }

  static isQuiet(originalUrl: string): boolean {
    return QUIET_PATHS.some((path) => originalUrl.includes(path));
  }
}
