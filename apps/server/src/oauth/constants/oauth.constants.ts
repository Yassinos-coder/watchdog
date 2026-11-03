import type { OAuthProviderDefinition, OAuthProviderId } from '../interfaces/oauth.interfaces';

export const OAUTH_STATE_COOKIE = 'wd_oauth_state';
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const OAUTH_FETCH_TIMEOUT_MS = 10_000;

export const OAUTH_PROVIDERS: Record<OAuthProviderId, OAuthProviderDefinition> = {
  google: {
    id: 'google',
    label: 'Google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
  },
  github: {
    id: 'github',
    label: 'GitHub',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
  },
};

export const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
export const GITHUB_USER_URL = 'https://api.github.com/user';
export const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';
