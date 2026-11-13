import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { webhooksService } from '../services/webhooksService';
import type { WebhookInput } from '../types/webhook.types';

export const webhookKeys = {
  config: ['webhooks', 'config'] as const,
  list: ['webhooks', 'list'] as const,
  deliveries: (webhookId: string) => ['webhooks', 'deliveries', webhookId] as const,
};

export function useWebhookConfig() {
  return useQuery({ queryKey: webhookKeys.config, queryFn: () => webhooksService.getConfig() });
}

export function useWebhooks() {
  return useQuery({ queryKey: webhookKeys.list, queryFn: () => webhooksService.list() });
}

export function useDeliveries(webhookId: string, enabled: boolean) {
  return useQuery({
    queryKey: webhookKeys.deliveries(webhookId),
    queryFn: () => webhooksService.deliveries(webhookId),
    enabled,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WebhookInput) => webhooksService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: webhookKeys.list }),
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { webhookId: string; changes: Partial<WebhookInput> & { enabled?: boolean } }) =>
      webhooksService.update(input.webhookId, input.changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: webhookKeys.list }),
  });
}

export function useTestWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) => webhooksService.test(webhookId),
    onSettled: (_, __, webhookId) =>
      queryClient.invalidateQueries({ queryKey: webhookKeys.deliveries(webhookId) }),
  });
}

export function useRotateWebhookSecret() {
  return useMutation({ mutationFn: (webhookId: string) => webhooksService.rotateSecret(webhookId) });
}

export function useRemoveWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) => webhooksService.remove(webhookId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: webhookKeys.list }),
  });
}
