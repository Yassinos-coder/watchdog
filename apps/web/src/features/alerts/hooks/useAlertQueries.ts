import { useQuery } from '@tanstack/react-query';
import { alertsService } from '../services/alertsService';

export const alertKeys = {
  channels: ['alerts', 'channels'] as const,
  deliveries: ['alerts', 'deliveries'] as const,
  smtp: ['alerts', 'smtp'] as const,
  rules: (projectId: string) => ['alerts', 'rules', projectId] as const,
};

export function useChannels() {
  return useQuery({ queryKey: alertKeys.channels, queryFn: () => alertsService.listChannels() });
}

export function useDeliveries() {
  return useQuery({
    queryKey: alertKeys.deliveries,
    queryFn: () => alertsService.listDeliveries(),
    refetchInterval: 15_000,
  });
}

export function useSmtpSettings() {
  return useQuery({ queryKey: alertKeys.smtp, queryFn: () => alertsService.getSmtp() });
}

export function useRules(projectId: string) {
  return useQuery({ queryKey: alertKeys.rules(projectId), queryFn: () => alertsService.listRules(projectId) });
}
