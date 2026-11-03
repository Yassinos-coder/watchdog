import type { Request } from 'express';
import type { Session, User } from '../../generated/prisma/client';
import type { MfaMethod, UserRole } from '../../generated/prisma/enums';

export interface SessionWithUser extends Session {
  user: User;
}

export interface AuthContext {
  session: SessionWithUser;
  user: User;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

export interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

export interface AuthUserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mfaMethods: MfaMethod[];
  needsMfaSetup: boolean;
}

export interface AuthResponse {
  mfaRequired: boolean;
  methods: MfaMethod[];
  user: AuthUserView | null;
}

export interface AuthOutcome {
  session: IssuedSession;
  body: AuthResponse;
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
  user: AuthUserView;
}

export interface PasskeyView {
  id: string;
  name: string;
  deviceType: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface SecuritySummary {
  methods: MfaMethod[];
  passkeys: PasskeyView[];
  recoveryCodesRemaining: number;
  emailCodeAvailable: boolean;
}
