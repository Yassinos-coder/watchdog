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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CHANNEL_META, DEFAULT_COOLDOWN_MINS, LEVELS, TRIGGER_LABEL } from '../constants/alert.constants';
import { useCreateRule, useUpdateRule } from '../hooks/useAlertMutations';
import { useChannels } from '../hooks/useAlertQueries';
import type { AlertRule, AlertTrigger, RuleInput } from '../types/alert.types';

interface RuleDialogProps {
  projectId: string;
  rule: AlertRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_SPIKE_THRESHOLD = 10;
const DEFAULT_SPIKE_WINDOW = 5;

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
  }, [open, rule]);

  const toggleChannel = (channelId: string, checked: boolean): void => {
    setChannelIds((current) => (checked ? [...current, channelId] : current.filter((id) => id !== channelId)));
  };

  const submit = (): void => {
    const input: RuleInput = {
      name: name.trim() || TRIGGER_LABEL[trigger],
      trigger,
      spikeThreshold: trigger === 'SPIKE' ? Number(threshold) : undefined,
      spikeWindowMins: trigger === 'SPIKE' ? Number(windowMins) : undefined,
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
      update.mutate({ ruleId: rule.id, changes: { ...input, environment: environment.trim() } }, handlers);
      return;
    }
    create.mutate(input, handlers);
  };

  const pending = create.isPending || update.isPending;

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
            <DialogDescription>Choose what should trigger an alert and where it goes.</DialogDescription>
          </DialogHeader>

          <FieldRow label="Name" htmlFor="rule-name">
            <Input id="rule-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Production errors" maxLength={80} />
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
                <Input id="rule-threshold" value={threshold} onChange={(event) => setThreshold(event.target.value)} inputMode="numeric" />
              </FieldRow>
              <FieldRow label="Within (minutes)" htmlFor="rule-window">
                <Input id="rule-window" value={windowMins} onChange={(event) => setWindowMins(event.target.value)} inputMode="numeric" />
              </FieldRow>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
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
            <FieldRow label="Environment" htmlFor="rule-env" hint="Leave empty for all.">
              <Input id="rule-env" value={environment} onChange={(event) => setEnvironment(event.target.value)} placeholder="production" />
            </FieldRow>
          </div>

          {trigger !== 'NEW_ISSUE' && (
            <FieldRow label="Quiet period (minutes)" htmlFor="rule-cooldown" hint="After alerting about an issue, stay quiet about it for this long.">
              <Input id="rule-cooldown" value={cooldown} onChange={(event) => setCooldown(event.target.value)} inputMode="numeric" className="sm:w-32" />
            </FieldRow>
          )}

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Send to</legend>
            {channels && channels.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You have no channels yet.{' '}
                <Link to="/integrations" className="underline underline-offset-4" onClick={() => onOpenChange(false)}>
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
                  {channel.name} <span className="text-muted-foreground">({CHANNEL_META[channel.type].label})</span>
                </Label>
              </div>
            ))}
          </fieldset>

          <DocsLink path="alerts/overview#triggers">How alert rules work</DocsLink>

          <DialogFooter>
            <Button type="submit" disabled={pending || channelIds.length === 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {rule ? 'Save rule' : 'Create rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
