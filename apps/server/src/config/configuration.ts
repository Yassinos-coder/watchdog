const DEFAULT_PORT = 3000;
const DEFAULT_API_PREFIX = 'api';

export default () => ({
  port: Number(process.env.PORT) || DEFAULT_PORT,
  apiPrefix: process.env.API_PREFIX || DEFAULT_API_PREFIX,
  appUrl: process.env.APP_URL || `http://localhost:${Number(process.env.PORT) || DEFAULT_PORT}`,
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  webDistPath: process.env.WEB_DIST_PATH || undefined,
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || undefined,
  },
  security: {
    secretKey: process.env.WATCHDOG_SECRET_KEY || undefined,
    setupToken: process.env.SETUP_TOKEN || undefined,
  },
});
