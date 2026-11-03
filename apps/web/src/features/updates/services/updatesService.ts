import { BaseApiClient } from '@/services/BaseApiClient';
import type { UpdateStatus } from '../types/update.types';

class UpdatesService extends BaseApiClient {
  getStatus(): Promise<UpdateStatus> {
    return this.get('/updates');
  }
}

export const updatesService = new UpdatesService();
