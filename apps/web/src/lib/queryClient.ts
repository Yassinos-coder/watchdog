import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/BaseApiClient';

const MAX_RETRIES = 2;
const STALE_TIME_MS = 15_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < MAX_RETRIES;
      },
    },
  },
});
