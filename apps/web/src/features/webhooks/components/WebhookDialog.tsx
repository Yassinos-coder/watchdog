import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { useCreateWebhook, useUpdateWebhook } from '../hooks/useWebhooks';
import type { Webhook, WebhookEventInfo } from '../types/webhook.types';

interface WebhookDialogProps {
  open: boolean;
  events: WebhookEventInfo[];
  editing: Webhook | null;
  onOpenChange: (open: boolean) => void;
  onCreated: (secret: string) => void;
}

export function WebhookDialog({ open, events, editing, onOpenChange, onCreated }: WebhookDialogProps) {
  const create = useCreateWebhook();
  const update = useUpdateWebhook();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setUrl(editing?.url ?? '');
    setSelected(editing?.events ?? ['issue.new', 'issue.regression']);
  }, [open, editing]);

  const pending = create.isPending || update.isPending;
  const toggle = (id: string, checked: boolean): void =>
    setSelected((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)));

  const submit = (): void => {
    const input = { name: name.trim(), url: url.trim(), events: selected };
    if (editing) {
      update.mutate(
        { webhookId: editing.id, changes: input },
        {
          onSuccess: () => {
            toast.success('Webhook updated');
            onOpenChange(false);
          },
          onError: (failure) => toast.error(failure.message),
        },
      );
      return;
    }
    create.mutate(input, {
      onSuccess: (created) => {
        onOpenChange(false);
        onCreated(created.secret);
      },
      onError: (failure) => toast.error(failure.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit webhook' : 'Add a webhook'}</DialogTitle>
            <DialogDescription>
              Watchdog sends a signed JSON request to your address whenever one of the chosen events happens.
            </DialogDescription>
          </DialogHeader>
          <FieldRow label="Name" htmlFor="webhook-name">
            <Input id="webhook-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Incident bot" autoFocus />
          </FieldRow>
          <FieldRow label="URL" htmlFor="webhook-url" hint="Must start with https:// and be reachable from the internet.">
            <Input id="webhook-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/hooks/watchdog" inputMode="url" spellCheck={false} />
          </FieldRow>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Events</legend>
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-accent/40">
                <Checkbox
                  id={`event-${event.id}`}
                  className="mt-0.5"
                  checked={selected.includes(event.id)}
                  onCheckedChange={(checked) => toggle(event.id, checked === true)}
                />
                <div className="min-w-0">
                  <Label htmlFor={`event-${event.id}`} className="font-medium">
                    {event.label} <span className="font-mono text-xs font-normal text-muted-foreground">{event.id}</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              </div>
            ))}
          </fieldset>
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim() || !url.trim() || selected.length === 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? 'Save changes' : 'Add webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
