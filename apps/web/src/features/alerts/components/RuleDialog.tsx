import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DocsLink } from '@/components/DocsLink';
import { FieldRow } from '@/components/FieldRow';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useMetricNames,
  useTransactionSummary,
} from '@/features/performance/hooks/usePerformanceQueries';
import {
  CHANNEL_META,
  COMPARATOR_LABEL,
  DEFAULT_COOLDOWN_MINS,
  DEFAULT_METRIC_WINDOW_MINS,
  LEVELS,
  METRIC_AGGREGATION_LABEL,
  TRIGGER_LABEL,
} from '../constants/alert.constants';
import { useCreateRule, useUpdateRule } from '../hooks/useAlertMutations';
import { useChannels } from '../hooks/useAlertQueries';
import type {
  AlertRule,
  AlertTrigger,
  MetricAlertAggregation,
  MetricAlertSource,
  MetricComparator,
  RuleInput,
} from '../types/alert.types';

interface RuleDialogProps {
  projectId: string;
  rule: AlertRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_SPIKE_THRESHOLD = 10;
const DEFAULT_SPIKE_WINDOW = 5;
const ALL_TRANSACTIONS = '__all__';

export function RuleDialog({ projectId, rule, open, onOpenChange }: RuleDialogProps) {
  const { data: channels } = useChannels();
  const create = useCreateRule(projectId);
  const update = useUpdateRule(projectId);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<AlertTrigger>('NEW_ISSUE');
  const [threshold, setThreshold] = useState(String(DEFAULT_SPIKE_THRESHOLD));
  const [windowMins, setWindowMins] = useState(String(DEFAULT_SPIKE_WINDOW));
  const [minLevel, setMinLevel] = useState('error');
  const [environment, setEnvironment] = useState('');
  const [cooldown, setCooldown] = useState(String(DEFAULT_COOLDOWN_MINS));
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [metricSource, setMetricSource] = useState<MetricAlertSource>('METRIC');
  const [metricName, setMetricName] = useState('');
  const [aggregation, setAggregation] = useState<MetricAlertAggregation>('AVG');
  const [comparator, setComparator] = useState<MetricComparator>('ABOVE');
  const [metricThreshold, setMetricThreshold] = useState('');
  const [metricWindow, setMetricWindow] = useState(String(DEFAULT_METRIC_WINDOW_MINS));
  const [tagKey, setTagKey] = useState('');
  const [tagValue, setTagValue] = useState('');
  const { data: metrics } = useMetricNames(projectId);
  const { data: transactions } = useTransactionSummary(projectId, '30d');

  useEffect(() => {
    if (!open) return;
    setName(rule?.name ?? '');
    setTrigger(rule?.trigger ?? 'NEW_ISSUE');
    setThreshold(String(rule?.spikeThreshold ?? DEFAULT_SPIKE_THRESHOLD));
    setWindowMins(String(rule?.spikeWindowMins ?? DEFAULT_SPIKE_WINDOW));
    setMinLevel(rule?.minLevel ?? 'error');
    setEnvironment(rule?.environment ?? '');
    setCooldown(String(rule?.cooldownMins ?? DEFAULT_COOLDOWN_MINS));
    setChannelIds(rule?.channelIds ?? []);
    setMetricSource(rule?.metricSource ?? 'METRIC');
    setMetricName(rule?.metricName ?? '');
    setAggregation(rule?.metricAggregation ?? 'AVG');
    setComparator(rule?.metricComparator ?? 'ABOVE');
    setMetricThreshold(
      rule?.metricThreshold === null || rule?.metricThreshold === undefined
        ? ''
        : String(rule.metricThreshold),
    );
    setMetricWindow(String(rule?.metricWindowMins ?? DEFAULT_METRIC_WINDOW_MINS));
    setTagKey(rule?.metricTagKey ?? '');
    setTagValue(rule?.metricTagValue ?? '');
  }, [open, rule]);

  const toggleChannel = (channelId: string, checked: boolean): void => {
    setChannelIds((current) =>
      checked ? [...current, channelId] : current.filter((id) => id !== channelId),
    );
  };

  const submit = (): void => {
    const input: RuleInput = {
      name: name.trim() || TRIGGER_LABEL[trigger],
      trigger,
      spikeThreshold: trigger === 'SPIKE' ? Number(threshold) : undefined,
      spikeWindowMins: trigger === 'SPIKE' ? Number(windowMins) : undefined,
      ...(trigger === 'METRIC'
        ? {
            metricSource,
            metricName:
              metricSource === 'METRIC' || metricName !== ALL_TRANSACTIONS
                ? metricName || undefined
                : undefined,
            metricAggregation: aggregation,
            metricComparator: comparator,
            metricThreshold: Number(metricThreshold),
            metricWindowMins: Number(metricWindow),
            metricTagKey: tagKey.trim() || undefined,
            metricTagValue: tagKey.trim() ? tagValue.trim() : undefined,
          }
        : {}),
      minLevel,
      environment: environment.trim() || undefined,
      cooldownMins: Number(cooldown) || 0,
      enabled: rule?.enabled ?? true,
      channelIds,
    };
    const handlers = {
      onSuccess: () => {
        toast.success(rule ? 'Rule updated' : 'Rule created');
        onOpenChange(false);
      },
      onError: (error: Error) => toast.error(error.message),
    };
    if (rule) {
      update.mutate(
        {
          ruleId: rule.id,
          changes: {
            ...input,
            environment: environment.trim(),
            ...(trigger === 'METRIC'
              ? {
                  metricName: input.metricName ?? '',
                  metricTagKey: tagKey.trim(),
                  metricTagValue: tagValue.trim(),
                }
              : {}),
          },
        },
        handlers,
      );
      return;
    }
    create.mutate(input, handlers);
  };

  const pending = create.isPending || update.isPending;
  const metricValid =
    trigger !== 'METRIC' ||
    (metricThreshold.trim() !== '' &&
      Number.isFinite(Number(metricThreshold)) &&
      (metricSource === 'TRANSACTIONS' || metricName.length > 0) &&
      (tagKey.trim() === '' || tagValue.trim() !== ''));
  const thresholdHint =
    metricSource === 'TRANSACTIONS' && aggregation !== 'COUNT' && aggregation !== 'RATE'
      ? 'In milliseconds.'
      : metrics?.find((metric) => metric.name === metricName)?.unit
        ? `In ${metrics.find((metric) => metric.name === metricName)?.unit}.`
        : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{rule ? 'Edit rule' : 'New alert rule'}</DialogTitle>
            <DialogDescription>
              Choose what should trigger an alert and where it goes.
            </DialogDescription>
          </DialogHeader>

          <FieldRow label="Name" htmlFor="rule-name">
            <Input
              id="rule-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Production errors"
              maxLength={80}
            />
          </FieldRow>

          <FieldRow label="Alert me when" htmlFor="rule-trigger">
            <Select value={trigger} onValueChange={(value) => setTrigger(value as AlertTrigger)}>
              <SelectTrigger id="rule-trigger" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TRIGGER_LABEL) as AlertTrigger[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {TRIGGER_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          {trigger === 'SPIKE' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="Events" htmlFor="rule-threshold">
                <Input
                  id="rule-threshold"
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  inputMode="numeric"
                />
              </FieldRow>
              <FieldRow label="Within (minutes)" htmlFor="rule-window">
                <Input
                  id="rule-window"
                  value={windowMins}
                  onChange={(event) => setWindowMins(event.target.value)}
                  inputMode="numeric"
                />
              </FieldRow>
            </div>
          )}

          {trigger === 'METRIC' && (
            <div className="grid gap-4 rounded-lg border p-4">
              <FieldRow label="Data" htmlFor="rule-metric-source">
                <Select
                  value={metricSource}
                  onValueChange={(value) => {
                    setMetricSource(value as MetricAlertSource);
                    setMetricName('');
                  }}
                >
                  <SelectTrigger id="rule-metric-source" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="METRIC">Custom metric</SelectItem>
                    <SelectItem value="TRANSACTIONS">Transaction duration</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
              {metricSource === 'METRIC' ? (
                <FieldRow label="Metric" htmlFor="rule-metric-name">
                  <Select value={metricName} onValueChange={setMetricName}>
                    <SelectTrigger id="rule-metric-name" className="w-full">
                      <SelectValue placeholder="Choose a metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {metrics?.map((metric) => (
                        <SelectItem key={metric.name} value={metric.name}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
              ) : (
                <FieldRow label="Transaction" htmlFor="rule-metric-transaction">
                  <Select value={metricName || ALL_TRANSACTIONS} onValueChange={setMetricName}>
                    <SelectTrigger id="rule-metric-transaction" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_TRANSACTIONS}>All transactions</SelectItem>
                      {transactions?.map((row) => (
                        <SelectItem key={row.name} value={row.name}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow label="Summarize as" htmlFor="rule-aggregation">
                  <Select
                    value={aggregation}
                    onValueChange={(value) => setAggregation(value as MetricAlertAggregation)}
                  >
                    <SelectTrigger id="rule-aggregation" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(METRIC_AGGREGATION_LABEL) as MetricAlertAggregation[]).map(
                        (value) => (
                          <SelectItem key={value} value={value}>
                            {METRIC_AGGREGATION_LABEL[value]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Alert when it" htmlFor="rule-comparator">
                  <Select
                    value={comparator}
                    onValueChange={(value) => setComparator(value as MetricComparator)}
                  >
                    <SelectTrigger id="rule-comparator" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(COMPARATOR_LABEL) as MetricComparator[]).map((value) => (
                        <SelectItem key={value} value={value}>
                          {COMPARATOR_LABEL[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Threshold" htmlFor="rule-metric-threshold" hint={thresholdHint}>
                  <Input
                    id="rule-metric-threshold"
                    value={metricThreshold}
                    onChange={(event) => setMetricThreshold(event.target.value)}
                    inputMode="decimal"
                  />
                </FieldRow>
                <FieldRow label="Over the last (minutes)" htmlFor="rule-metric-window">
                  <Input
                    id="rule-metric-window"
                    value={metricWindow}
                    onChange={(event) => setMetricWindow(event.target.value)}
                    inputMode="numeric"
                  />
                </FieldRow>
                <FieldRow label="Only tag (optional)" htmlFor="rule-tag-key">
                  <Input
                    id="rule-tag-key"
                    value={tagKey}
                    onChange={(event) => setTagKey(event.target.value)}
                    placeholder="tier"
                    maxLength={100}
                  />
                </FieldRow>
                {tagKey.trim() !== '' && (
                  <FieldRow label="Equals" htmlFor="rule-tag-value">
                    <Input
                      id="rule-tag-value"
                      value={tagValue}
                      onChange={(event) => setTagValue(event.target.value)}
                      placeholder="pro"
                      maxLength={200}
                    />
                  </FieldRow>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {trigger !== 'METRIC' && (
              <FieldRow label="Severity" htmlFor="rule-level">
                <Select value={minLevel} onValueChange={setMinLevel}>
                  <SelectTrigger id="rule-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}
            <FieldRow label="Environment" htmlFor="rule-env" hint="Leave empty for all.">
              <Input
                id="rule-env"
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
                placeholder="production"
              />
            </FieldRow>
          </div>

          {trigger !== 'NEW_ISSUE' && (
            <FieldRow
              label="Quiet period (minutes)"
              htmlFor="rule-cooldown"
              hint={
                trigger === 'METRIC'
                  ? 'After alerting, stay quiet for this long even if the metric is still off.'
                  : 'After alerting about an issue, stay quiet about it for this long.'
              }
            >
              <Input
                id="rule-cooldown"
                value={cooldown}
                onChange={(event) => setCooldown(event.target.value)}
                inputMode="numeric"
                className="sm:w-32"
              />
            </FieldRow>
          )}

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Send to</legend>
            {channels && channels.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You have no channels yet.{' '}
                <Link
                  to="/integrations"
                  className="underline underline-offset-4"
                  onClick={() => onOpenChange(false)}
                >
                  Add one in Integrations
                </Link>
                .
              </p>
            )}
            {channels?.map((channel) => (
              <div key={channel.id} className="flex items-center gap-2">
                <Checkbox
                  id={`channel-${channel.id}`}
                  checked={channelIds.includes(channel.id)}
                  onCheckedChange={(checked) => toggleChannel(channel.id, checked === true)}
                />
                <Label htmlFor={`channel-${channel.id}`} className="font-normal">
                  {channel.name}{' '}
                  <span className="text-muted-foreground">
                    ({CHANNEL_META[channel.type].label})
                  </span>
                </Label>
              </div>
            ))}
          </fieldset>

          <DocsLink path="alerts/overview#triggers">How alert rules work</DocsLink>

          <DialogFooter>
            <Button type="submit" disabled={pending || channelIds.length === 0 || !metricValid}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {rule ? 'Save rule' : 'Create rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
