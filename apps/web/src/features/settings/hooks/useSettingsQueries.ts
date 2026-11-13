import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';

export const settingsKeys = {
  sessions: ['settings', 'sessions'] as const,
  instance: ['settings', 'instance'] as const,
};

export function useSessions() {
  return useQuery({ queryKey: settingsKeys.sessions, queryFn: () => settingsService.listSessions() });
}

export function useInstance() {
  return useQuery({ queryKey: settingsKeys.instance, queryFn: () => settingsService.getInstance() });
}
