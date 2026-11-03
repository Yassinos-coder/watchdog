import { BaseApiClient } from '@/services/BaseApiClient';
import type { Replay, ReplayEvents, ReplayPage } from '../types/replay.types';

class ReplaysService extends BaseApiClient {
  list(projectId: string, page: number): Promise<ReplayPage> {
    return this.get(`/projects/${projectId}/replays?page=${page}`);
  }

  getEvents(replayId: string): Promise<ReplayEvents> {
    return this.get(`/replays/${replayId}`);
  }

  findForEvent(projectId: string, eventId: string): Promise<Replay | null> {
    return this.get(`/projects/${projectId}/events/${eventId}/replay`);
  }

  remove(replayId: string): Promise<void> {
    return this.delete(`/replays/${replayId}`);
  }
}

export const replaysService = new ReplaysService();
