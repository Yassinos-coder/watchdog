export type MfaMethod = 'TOTP' | 'PASSKEY' | 'EMAIL';
export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mfaMethods: MfaMethod[];
  needsMfaSetup: boolean;
}

export interface AuthSession {
  mfaRequired: boolean;
  methods: MfaMethod[];
  user: AuthUser | null;
}

export interface AuthStatus {
  setupRequired: boolean;
  emailCodeAvailable: boolean;
}

export interface TotpEnrollment {
  secret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
}

export interface EnrollmentResult {
  recoveryCodes: string[] | null;
  user: AuthUser;
}

export interface PasskeySummary {
  id: string;
  name: string;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface SecuritySummary {
  methods: MfaMethod[];
  passkeys: PasskeySummary[];
  recoveryCodesRemaining: number;
  emailCodeAvailable: boolean;
}

export interface SetupInput {
  setupToken: string;
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type VerifyMethod = 'totp' | 'recovery' | 'email';
