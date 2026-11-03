import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsService } from '../services/alertsService';
import type { CreateChannelInput, RuleInput, SaveSmtpInput } from '../types/alert.types';
import { alertKeys } from './useAlertQueries';

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChannelInput) => alertsService.createChannel(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertKeys.channels }),
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { channelId: string; enabled?: boolean; name?: string }) =>
      alertsService.updateChannel(input.channelId, { enabled: input.enabled, name: input.name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertKeys.channels }),
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => alertsService.removeChannel(channelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useTestChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => alertsService.testChannel(channelId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: alertKeys.deliveries }),
  });
}

export function useSaveSmtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveSmtpInput) => alertsService.saveSmtp(input),
    onSuccess: (settings) => queryClient.setQueryData(alertKeys.smtp, settings),
  });
}

export function useClearSmtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => alertsService.clearSmtp(),
    onSuccess: (settings) => queryClient.setQueryData(alertKeys.smtp, settings),
  });
}

export function useSendTestEmail() {
  return useMutation({ mutationFn: (to: string) => alertsService.sendTestEmail(to) });
}

export function useCreateRule(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RuleInput) => alertsService.createRule(projectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertKeys.rules(projectId) }),
  });
}

export function useUpdateRule(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { ruleId: string; changes: Partial<RuleInput> }) =>
      alertsService.updateRule(input.ruleId, input.changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertKeys.rules(projectId) }),
  });
}

export function useDeleteRule(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => alertsService.removeRule(ruleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertKeys.rules(projectId) }),
  });
}
