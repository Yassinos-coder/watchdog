import { BadGatewayException, Injectable } from '@nestjs/common';
import {
  GITHUB_EMAILS_URL,
  GITHUB_USER_URL,
  GOOGLE_USERINFO_URL,
  OAUTH_FETCH_TIMEOUT_MS,
  OAUTH_PROVIDERS,
} from '../constants/oauth.constants';
import type { OAuthCredentials, OAuthProfile, OAuthProviderId } from '../interfaces/oauth.interfaces';

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

@Injectable()
export class OAuthProfileService {
  async fetchProfile(
    provider: OAuthProviderId,
    credentials: OAuthCredentials,
    code: string,
    redirectUri: string,
  ): Promise<OAuthProfile | null> {
    const accessToken = await this.exchangeCode(provider, credentials, code, redirectUri);
    return provider === 'google' ? this.googleProfile(accessToken) : this.githubProfile(accessToken);
  }

  private async exchangeCode(
    provider: OAuthProviderId,
    credentials: OAuthCredentials,
    code: string,
    redirectUri: string,
  ): Promise<string> {
    const body = await this.request<{ access_token?: string }>(OAUTH_PROVIDERS[provider].tokenUrl, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
    });
    if (!body.access_token) {
      throw new BadGatewayException('The sign-in provider did not return an access token');
    }
    return body.access_token;
  }

  private async googleProfile(accessToken: string): Promise<OAuthProfile | null> {
    const info = await this.request<{ email?: string; email_verified?: boolean; name?: string }>(
      GOOGLE_USERINFO_URL,
      { headers: { authorization: `Bearer ${accessToken}` } },
    );
    if (!info.email || info.email_verified !== true) {
      return null;
    }
    return { email: info.email.toLowerCase(), name: info.name?.trim() || info.email.split('@')[0] };
  }

  private async githubProfile(accessToken: string): Promise<OAuthProfile | null> {
    const headers = {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'watchdog',
    };
    const [user, emails] = await Promise.all([
      this.request<{ name?: string | null; login?: string }>(GITHUB_USER_URL, { headers }),
      this.request<GithubEmail[]>(GITHUB_EMAILS_URL, { headers }),
    ]);
    const primary = emails.find((entry) => entry.primary && entry.verified);
    if (!primary) {
      return null;
    }
    return {
      email: primary.email.toLowerCase(),
      name: user.name?.trim() || user.login || primary.email.split('@')[0],
    };
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS) }).catch(
      () => null,
    );
    if (!response || !response.ok) {
      throw new BadGatewayException('Could not reach the sign-in provider');
    }
    return (await response.json()) as T;
  }
}
