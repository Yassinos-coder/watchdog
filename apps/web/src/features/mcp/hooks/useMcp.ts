import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mcpService } from '../services/mcpService';
import type { ApiKeyInput } from '../types/mcp.types';

export const mcpKeys = {
  config: ['mcp', 'config'] as const,
  keys: ['mcp', 'keys'] as const,
};

export function useMcpConfig() {
  return useQuery({ queryKey: mcpKeys.config, queryFn: () => mcpService.getConfig() });
}

export function useApiKeys() {
  return useQuery({ queryKey: mcpKeys.keys, queryFn: () => mcpService.listKeys() });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApiKeyInput) => mcpService.createKey(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mcpKeys.keys }),
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { keyId: string; changes: Partial<ApiKeyInput> }) =>
      mcpService.updateKey(input.keyId, input.changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mcpKeys.keys }),
  });
}

export function useRemoveApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => mcpService.removeKey(keyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mcpKeys.keys }),
  });
}
