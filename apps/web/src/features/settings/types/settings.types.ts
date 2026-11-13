export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export interface InstanceInfo {
  version: string;
  appUrl: string;
  appUrlExplicit: boolean;
  updateChecks: boolean;
  retention: {
    eventDays: number;
    performanceDays: number;
    rollupDays: number;
    replayDays: number;
  };
  signIn: {
    google: boolean;
    github: boolean;
  };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailInput {
  email: string;
  currentPassword: string;
}
