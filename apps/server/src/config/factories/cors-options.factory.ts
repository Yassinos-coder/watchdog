import type { CorsOptions, CorsOptionsDelegate } from '@nestjs/common/interfaces/external/cors-options.interface';

const PREFLIGHT_MAX_AGE_SECONDS = 86_400;

export class CorsOptionsFactory {
  static create(allowedOrigins: string[], apiPrefix: string): CorsOptionsDelegate<{ url?: string }> {
    const ingestPrefix = `/${apiPrefix}/ingest/`;
    const dashboardOptions: CorsOptions = { origin: allowedOrigins, credentials: true };
    const ingestOptions: CorsOptions = {
      origin: '*',
      methods: ['POST', 'OPTIONS'],
      allowedHeaders: ['content-type', 'x-watchdog-key'],
      maxAge: PREFLIGHT_MAX_AGE_SECONDS,
    };
    return (request, callback) => {
      callback(null, request.url?.startsWith(ingestPrefix) ? ingestOptions : dashboardOptions);
    };
  }
}
