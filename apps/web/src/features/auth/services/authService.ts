import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { BaseApiClient } from '@/services/BaseApiClient';
import type {
  AuthSession,
  AuthStatus,
  OAuthProvider,
  EnrollmentResult,
  LoginInput,
  SecuritySummary,
  SetupInput,
  TotpEnrollment,
  VerifyMethod,
} from '../types/auth.types';

class AuthService extends BaseApiClient {
  getStatus(): Promise<AuthStatus> {
    return this.get('/auth/status');
  }

  getOAuthProviders(): Promise<OAuthProvider[]> {
    return this.get('/oauth/providers');
  }

  getSession(): Promise<AuthSession> {
    return this.get('/auth/session');
  }

  getSecuritySummary(): Promise<SecuritySummary> {
    return this.get('/auth/mfa/summary');
  }

  setup(input: SetupInput): Promise<AuthSession> {
    return this.post('/auth/setup', input);
  }

  login(input: LoginInput): Promise<AuthSession> {
    return this.post('/auth/login', input);
  }

  verify(method: VerifyMethod, code: string): Promise<AuthSession> {
    return this.post('/auth/mfa/verify', { method, code });
  }

  sendEmailCode(): Promise<void> {
    return this.post('/auth/mfa/email/send');
  }

  beginTotp(): Promise<TotpEnrollment> {
    return this.post('/auth/mfa/totp/setup');
  }

  confirmTotp(code: string): Promise<EnrollmentResult> {
    return this.post('/auth/mfa/totp/confirm', { code });
  }

  confirmEmail(code: string): Promise<EnrollmentResult> {
    return this.post('/auth/mfa/email/confirm', { code });
  }

  passkeyRegistrationOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return this.post('/auth/mfa/passkey/register/options');
  }

  verifyPasskeyRegistration(
    response: RegistrationResponseJSON,
    name?: string,
  ): Promise<EnrollmentResult> {
    return this.post('/auth/mfa/passkey/register/verify', { response, name });
  }

  passkeyAuthenticationOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.post('/auth/mfa/passkey/authenticate/options');
  }

  verifyPasskeyAuthentication(response: AuthenticationResponseJSON): Promise<AuthSession> {
    return this.post('/auth/mfa/passkey/authenticate/verify', { response });
  }

  removePasskey(passkeyId: string): Promise<void> {
    return this.delete(`/auth/mfa/passkeys/${encodeURIComponent(passkeyId)}`);
  }

  disableMethod(method: 'TOTP' | 'EMAIL'): Promise<void> {
    return this.delete(`/auth/mfa/methods/${method}`);
  }

  regenerateRecoveryCodes(): Promise<{ recoveryCodes: string[] }> {
    return this.post('/auth/mfa/recovery-codes/regenerate');
  }

  logout(): Promise<void> {
    return this.post('/auth/logout');
  }
}

export const authService = new AuthService();
