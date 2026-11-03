import { ParsedDsn } from '../interfaces';

const PROJECT_ID_PATTERN = /^[0-9a-f-]{36}$/i;

export class DsnParser {
  static parse(dsn: string): ParsedDsn {
    let url: URL;
    try {
      url = new URL(dsn);
    } catch {
      throw new TypeError('Watchdog: the DSN is not a valid URL');
    }
    const publicKey = decodeURIComponent(url.username);
    const projectId = url.pathname.replace(/^\/+|\/+$/g, '');
    if (!publicKey || !PROJECT_ID_PATTERN.test(projectId)) {
      throw new TypeError('Watchdog: the DSN must look like https://<key>@<host>/<project-id>');
    }
    const origin = `${url.protocol}//${url.host}`;
    return {
      publicKey,
      projectId,
      origin,
      endpoint: `${origin}/api/ingest/v1/${projectId}/events`,
    };
  }
}
