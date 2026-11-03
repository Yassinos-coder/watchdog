import { useQuery } from '@tanstack/react-query';
import { updatesService } from '../services/updatesService';

const HOUR_MS = 60 * 60 * 1000;

export function useUpdateStatus(enabled: boolean) {
  return useQuery({
    queryKey: ['updates', 'status'],
    queryFn: () => updatesService.getStatus(),
    enabled,
    staleTime: HOUR_MS,
    retry: false,
  });
}
