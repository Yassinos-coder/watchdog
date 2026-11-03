export type OAuthProviderId = 'google' | 'github';

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

export interface OAuthProviderDefinition {
  id: OAuthProviderId;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
}

export interface OAuthProviderView {
  id: OAuthProviderId;
  label: string;
}

export interface OAuthProfile {
  email: string;
  name: string;
}

export interface OAuthStart {
  url: string;
  state: string;
}

export interface OAuthResult {
  token: string;
  expiresAt: Date;
  redirectPath: string;
}
