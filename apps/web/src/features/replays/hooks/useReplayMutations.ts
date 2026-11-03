import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { replaysService } from '../services/replaysService';

export function useDeleteReplay(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replayId: string) => replaysService.remove(replayId),
    onSuccess: () => {
      toast.success('Replay deleted');
      void queryClient.invalidateQueries({ queryKey: ['replays', projectId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
