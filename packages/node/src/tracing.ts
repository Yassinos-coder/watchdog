import { startTransaction } from './node-sdk';

interface TracedRequest {
  method?: string;
  originalUrl?: string;
  url?: string;
  route?: { path?: string };
  baseUrl?: string;
}

interface TracedResponse {
  statusCode: number;
  once(event: 'finish' | 'close', listener: () => void): unknown;
}

type NextFunction = (error?: unknown) => void;

const SERVER_ERROR = 500;
const IGNORED_PREFIXES = ['/health', '/api/health'];

export function expressTracing(options: { ignorePaths?: string[] } = {}) {
  const ignored = [...IGNORED_PREFIXES, ...(options.ignorePaths ?? [])];
  return (request: TracedRequest, response: TracedResponse, next: NextFunction): void => {
    const url = request.originalUrl ?? request.url ?? '';
    if (ignored.some((prefix) => url.startsWith(prefix))) {
      next();
      return;
    }
    const transaction = startTransaction({
      name: `${request.method ?? 'GET'} ${url.split('?')[0]}`,
      op: 'http.server',
    });
    if (!transaction) {
      next();
      return;
    }
    let done = false;
    const finish = (): void => {
      if (done) {
        return;
      }
      done = true;
      const route = request.route?.path;
      const name = route ? `${request.method} ${request.baseUrl ?? ''}${route}` : undefined;
      transaction.setTag('http.status_code', String(response.statusCode));
      transaction.finish(response.statusCode >= SERVER_ERROR ? 'internal_error' : 'ok', name);
    };
    response.once('finish', finish);
    response.once('close', finish);
    next();
  };
}
