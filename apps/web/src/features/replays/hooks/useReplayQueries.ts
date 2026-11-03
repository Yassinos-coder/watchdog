import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { replaysService } from '../services/replaysService';

export const replayKeys = {
  list: (projectId: string, page: number) => ['replays', projectId, page] as const,
  events: (replayId: string) => ['replays', 'events', replayId] as const,
  forEvent: (projectId: string, eventId: string) => ['replays', projectId, 'event', eventId] as const,
};

export function useReplays(projectId: string, page: number) {
  return useQuery({
    queryKey: replayKeys.list(projectId, page),
    queryFn: () => replaysService.list(projectId, page),
    placeholderData: keepPreviousData,
  });
}

export function useReplayEvents(replayId: string | null) {
  return useQuery({
    queryKey: replayKeys.events(replayId ?? ''),
    queryFn: () => replaysService.getEvents(replayId as string),
    enabled: replayId !== null,
    staleTime: Infinity,
  });
}

export function useReplayForEvent(projectId: string, eventId: string) {
  return useQuery({
    queryKey: replayKeys.forEvent(projectId, eventId),
    queryFn: () => replaysService.findForEvent(projectId, eventId),
  });
}
