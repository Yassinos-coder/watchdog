const DEFAULT_PORT = 3000;
const DEFAULT_API_PREFIX = 'api';
const DEFAULT_SMTP_PORT = 587;
const SECURE_SMTP_PORT = 465;
const DEFAULT_EVENTS_PER_MINUTE = 6000;

const resolvePort = (): number => Number(process.env.PORT) || DEFAULT_PORT;

const toOrigin = (value: string): string => {
  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, '');
};

const resolveAppUrl = (): string => {
  const explicit = process.env.APP_URL;
  if (explicit) {
    return toOrigin(explicit);
  }
  const providerDomain =
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.RENDER_EXTERNAL_HOSTNAME ||
    process.env.KOYEB_PUBLIC_DOMAIN ||
    process.env.DIGITALOCEAN_APP_URL ||
    (process.env.FLY_APP_NAME ? `${process.env.FLY_APP_NAME}.fly.dev` : undefined);
  if (providerDomain) {
    return toOrigin(providerDomain);
  }
  return `http://localhost:${resolvePort()}`;
};

const parseTrustProxy = (value: string | undefined): number | boolean => {
  if (!value || value === 'false') {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : false;
};

const splitList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export default () => {
  const appUrl = resolveAppUrl();
  const smtpPort = Number(process.env.SMTP_PORT) || DEFAULT_SMTP_PORT;
  const corsOrigins = splitList(process.env.CORS_ORIGINS);

  return {
    port: resolvePort(),
    apiPrefix: process.env.API_PREFIX || DEFAULT_API_PREFIX,
    appUrl,
    corsOrigins,
    webDistPath: process.env.WEB_DIST_PATH || undefined,
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      url: process.env.REDIS_URL || undefined,
    },
    ingest: {
      eventsPerMinute: Number(process.env.INGEST_EVENTS_PER_MINUTE) || DEFAULT_EVENTS_PER_MINUTE,
    },
    security: {
      secretKey: process.env.WATCHDOG_SECRET_KEY || undefined,
      setupToken: process.env.SETUP_TOKEN || undefined,
      secureCookies: appUrl.startsWith('https://'),
      trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    },
    webauthn: {
      rpName: 'Watchdog',
      rpId: new URL(appUrl).hostname,
      origins: [appUrl, ...corsOrigins],
    },
    mail: {
      host: process.env.SMTP_HOST || undefined,
      port: smtpPort,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === SECURE_SMTP_PORT,
      user: process.env.SMTP_USER || undefined,
      password: process.env.SMTP_PASSWORD || undefined,
      from: process.env.SMTP_FROM || process.env.SMTP_USER || undefined,
    },
  };
};
