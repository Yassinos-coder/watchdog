import { BellRing, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { RuleDialog } from '../components/RuleDialog';
import {
  COMPARATOR_LABEL,
  LEVELS,
  METRIC_AGGREGATION_LABEL,
  TRIGGER_LABEL,
} from '../constants/alert.constants';
import { useDeleteRule, useUpdateRule } from '../hooks/useAlertMutations';
import { useChannels, useRules } from '../hooks/useAlertQueries';
import { useCanManage } from '../hooks/useCanManage';
import type { AlertRule } from '../types/alert.types';

const describeMetric = (rule: AlertRule): string => {
  const subject = rule.metricName ?? 'transaction duration';
  const aggregation = rule.metricAggregation
    ? METRIC_AGGREGATION_LABEL[rule.metricAggregation]
    : '';
  const comparator = rule.metricComparator ? COMPARATOR_LABEL[rule.metricComparator] : '';
  const parts = [
    `${aggregation} of ${subject} ${comparator} ${rule.metricThreshold} over ${rule.metricWindowMins} min`,
    rule.metricTagKey ? `${rule.metricTagKey}=${rule.metricTagValue}` : null,
    rule.environment ? `only ${rule.environment}` : null,
  ];
  return parts.filter(Boolean).join(' · ');
};

export function AlertRulesPage() {
  const { projectId = '' } = useParams();
  const { data: rules, isLoading, error, refetch } = useRules(projectId);
  const { data: channels } = useChannels();
  const canManage = useCanManage();
  const update = useUpdateRule(projectId);
  const remove = useDeleteRule(projectId);
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openNew = (): void => {
    setEditing(null);
    setDialogOpen(true);
  };

  const describe = (rule: AlertRule): string => {
    if (rule.trigger === 'METRIC') {
      return describeMetric(rule);
    }
    const level = LEVELS.find((item) => item.value === rule.minLevel)?.label ?? rule.minLevel;
    const parts = [
      rule.trigger === 'SPIKE'
        ? `${rule.spikeThreshold} events in ${rule.spikeWindowMins} min`
        : TRIGGER_LABEL[rule.trigger],
      level,
      rule.environment ? `only ${rule.environment}` : null,
    ];
    return parts.filter(Boolean).join(' · ');
  };

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Rules that notify you when something goes wrong in this project."
        actions={
          canManage && rules && rules.length > 0 ? (
            <Button onClick={openNew}>
              <Plus className="size-4" /> New rule
            </Button>
          ) : undefined
        }
      />

      {isLoading && <Skeleton className="h-32 w-full" />}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}

      {rules && rules.length === 0 && (
        <EmptyState
          icon={BellRing}
          title="No alert rules yet"
          description={
            channels && channels.length === 0
              ? 'First connect a channel such as Slack or email, then create a rule that uses it.'
              : 'Create a rule to get notified about new issues, regressions or spikes.'
          }
          action={
            canManage ? (
              channels && channels.length === 0 ? (
                <Button asChild>
                  <Link to="/integrations">Connect a channel</Link>
                </Button>
              ) : (
                <Button onClick={openNew}>Create rule</Button>
              )
            ) : undefined
          }
        />
      )}

      {rules && rules.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {rules.map((rule) => (
            <li key={rule.id} className="grid grid-cols-1 gap-3 p-4 sm:flex sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{rule.name}</p>
                <p className="text-sm text-muted-foreground">{describe(rule)}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  To{' '}
                  {rule.channelIds
                    .map(
                      (id) =>
                        channels?.find((channel) => channel.id === id)?.name ?? 'removed channel',
                    )
                    .join(', ')}
                </p>
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    aria-label={`${rule.name} is ${rule.enabled ? 'on' : 'off'}`}
                    onCheckedChange={(enabled) =>
                      update.mutate(
                        { ruleId: rule.id, changes: { enabled } },
                        { onError: (failure) => toast.error(failure.message) },
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${rule.name}`}
                    onClick={() => {
                      setEditing(rule);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${rule.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete the rule "${rule.name}"?`)) {
                        remove.mutate(rule.id, {
                          onError: (failure) => toast.error(failure.message),
                        });
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <RuleDialog
        projectId={projectId}
        rule={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
