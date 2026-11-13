import type { AuthUser } from '@/features/auth/types/auth.types';
import { BaseApiClient } from '@/services/BaseApiClient';
import type { ChangeEmailInput, ChangePasswordInput, InstanceInfo, SessionInfo } from '../types/settings.types';

class SettingsService extends BaseApiClient {
  updateName(name: string): Promise<AuthUser> {
    return this.patch('/auth/profile', { name });
  }

  changeEmail(input: ChangeEmailInput): Promise<AuthUser> {
    return this.post('/auth/profile/email', input);
  }

  changePassword(input: ChangePasswordInput): Promise<void> {
    return this.post('/auth/profile/password', input);
  }

  listSessions(): Promise<SessionInfo[]> {
    return this.get('/auth/sessions');
  }

  revokeSession(sessionId: string): Promise<void> {
    return this.delete(`/auth/sessions/${sessionId}`);
  }

  revokeOtherSessions(): Promise<void> {
    return this.delete('/auth/sessions');
  }

  getInstance(): Promise<InstanceInfo> {
    return this.get('/settings/instance');
  }
}

export const settingsService = new SettingsService();
