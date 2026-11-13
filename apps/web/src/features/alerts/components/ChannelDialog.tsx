import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DocsLink } from '@/components/DocsLink';
import { FieldRow } from '@/components/FieldRow';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CHANNEL_META, CHANNEL_TYPES } from '../constants/alert.constants';
import { useCreateChannel } from '../hooks/useAlertMutations';
import type { ChannelType } from '../types/alert.types';
import { cn } from '@/lib/utils';

interface ChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelDialog({ open, onOpenChange }: ChannelDialogProps) {
  const create = useCreateChannel();
  const [type, setType] = useState<ChannelType>('SLACK');
  const [name, setName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [recipients, setRecipients] = useState('');

  const reset = (): void => {
    setType('SLACK');
    setName('');
    setWebhookUrl('');
    setBotToken('');
    setChatId('');
    setRecipients('');
  };

  const buildConfig = (): Record<string, unknown> => {
    if (type === 'TELEGRAM') {
      return { botToken, chatId };
    }
    if (type === 'EMAIL') {
      return { recipients: recipients.split(/[\s,;]+/).filter(Boolean) };
    }
    return { webhookUrl };
  };

  const submit = (): void => {
    create.mutate(
      { type, name: name.trim() || CHANNEL_META[type].label, config: buildConfig() },
      {
        onSuccess: () => {
          toast.success(`${CHANNEL_META[type].label} channel added`);
          onOpenChange(false);
          reset();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Add a channel</DialogTitle>
            <DialogDescription>Choose where Watchdog should send alerts.</DialogDescription>
          </DialogHeader>

          <div role="radiogroup" aria-label="Channel type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CHANNEL_TYPES.map((option) => {
              const { icon: Icon, label } = CHANNEL_META[option];
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={type === option}
                  onClick={() => setType(option)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-sm transition-colors hover:bg-accent',
                    type === option && 'border-foreground bg-accent font-medium',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>

          <FieldRow label="Name" htmlFor="channel-name" hint="How this channel is shown in the dashboard.">
            <Input
              id="channel-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={`${CHANNEL_META[type].label} alerts`}
              maxLength={80}
            />
          </FieldRow>

          {(type === 'SLACK' || type === 'DISCORD') && (
            <FieldRow label="Webhook URL" htmlFor="webhook-url">
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder={type === 'SLACK' ? 'https://hooks.slack.com/services/…' : 'https://discord.com/api/webhooks/…'}
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-xs"
              />
            </FieldRow>
          )}
          {type === 'TELEGRAM' && (
            <>
              <FieldRow label="Bot token" htmlFor="bot-token" hint="From @BotFather. It is stored encrypted.">
                <Input
                  id="bot-token"
                  type="password"
                  value={botToken}
                  onChange={(event) => setBotToken(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-xs"
                />
              </FieldRow>
              <FieldRow label="Chat ID or @username" htmlFor="chat-id" hint="Your own @username works once you have pressed Start in your bot. Groups use a number such as -1001234567890, and public channels use @channelname.">
                <Input id="chat-id" value={chatId} onChange={(event) => setChatId(event.target.value)} autoComplete="off" />
              </FieldRow>
            </>
          )}
          {type === 'EMAIL' && (
            <FieldRow label="Recipients" htmlFor="recipients" hint="Separate addresses with commas, spaces or new lines. Up to 10.">
              <Input
                id="recipients"
                value={recipients}
                onChange={(event) => setRecipients(event.target.value)}
                placeholder="oncall@example.com, dev@example.com"
                inputMode="email"
              />
            </FieldRow>
          )}

          <DocsLink path={CHANNEL_META[type].docsPath}>Setup guide for {CHANNEL_META[type].label}</DocsLink>

          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Add channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
