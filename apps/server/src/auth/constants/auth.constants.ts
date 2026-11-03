const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const SESSION_COOKIE_NAME = 'wd_session';
export const SESSION_TTL_MS = 14 * DAY_MS;
export const PENDING_SESSION_TTL_MS = 10 * MINUTE_MS;
export const SESSION_CLEANUP_INTERVAL_MS = 60 * MINUTE_MS;

export const MAX_FAILED_LOGINS = 8;
export const LOCK_DURATION_MS = 15 * MINUTE_MS;
export const MAX_MFA_ATTEMPTS = 5;

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_EMAIL_NAME_LENGTH_CHECKED = 4;

export const RECOVERY_CODE_COUNT = 10;
export const EMAIL_OTP_TTL_MS = 10 * MINUTE_MS;
export const EMAIL_OTP_LENGTH = 6;

export const TOTP_ISSUER = 'Watchdog';
export const TOTP_EPOCH_TOLERANCE_SECONDS = 30;

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ALLOW_PENDING_MFA_KEY = 'auth:allowPendingMfa';
export const ALLOW_MFA_SETUP_KEY = 'auth:allowMfaSetup';
