import { ChevronDown, KeyRound, Pencil, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Format } from '@/lib/format';
import {
  useDeliveries,
  useRemoveWebhook,
  useRotateWebhookSecret,
  useTestWebhook,
  useUpdateWebhook,
} from '../hooks/useWebhooks';
import type { Webhook } from '../types/webhook.types';

interface WebhookRowProps {
  webhook: Webhook;
  canManage: boolean;
  onEdit: (webhook: Webhook) => void;
  onSecret: (secret: string) => void;
}

export function WebhookRow({ webhook, canManage, onEdit, onSecret }: WebhookRowProps) {
  const [showDeliveries, setShowDeliveries] = useState(false);
  const { data: deliveries } = useDeliveries(webhook.id, showDeliveries);
  const update = useUpdateWebhook();
  const test = useTestWebhook();
  const rotate = useRotateWebhookSecret();
  const remove = useRemoveWebhook();
  const fail = (failure: Error): void => {
    toast.error(failure.message);
  };

  return (
    <li className="grid gap-3 p-4">
      <div className="grid gap-3 sm:flex sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{webhook.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{webhook.url}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {webhook.events.map((event) => (
              <Badge key={event} variant="secondary" className="font-mono">
                {event}
              </Badge>
            ))}
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <Switch
              checked={webhook.enabled}
              aria-label={`${webhook.name} is ${webhook.enabled ? 'on' : 'off'}`}
              onCheckedChange={(enabled) => update.mutate({ webhookId: webhook.id, changes: { enabled } }, { onError: fail })}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={test.isPending}
              onClick={() =>
                test.mutate(webhook.id, {
                  onSuccess: (delivery) =>
                    delivery.status === 'SENT'
                      ? toast.success(`Test delivered (${delivery.responseCode})`)
                      : toast.error(delivery.error ?? 'The test delivery failed'),
                  onError: fail,
                })
              }
            >
              <Send className="size-4" /> Send test
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Edit ${webhook.name}`} onClick={() => onEdit(webhook)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`New signing secret for ${webhook.name}`}
              disabled={rotate.isPending}
              onClick={() => {
                if (window.confirm('Create a new signing secret? The old one stops working immediately.')) {
                  rotate.mutate(webhook.id, { onSuccess: (result) => onSecret(result.secret), onError: fail });
                }
              }}
            >
              <KeyRound className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${webhook.name}`}
              onClick={() => {
                if (window.confirm(`Delete the webhook "${webhook.name}"?`)) remove.mutate(webhook.id, { onError: fail });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>
      <button
        type="button"
        className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={showDeliveries}
        onClick={() => setShowDeliveries((current) => !current)}
      >
        <ChevronDown className={`size-3.5 transition-transform ${showDeliveries ? 'rotate-180' : ''}`} />
        Recent deliveries
      </button>
      {showDeliveries && (
        <ul className="grid gap-1 rounded-lg bg-muted/40 p-3 text-sm">
          {deliveries?.length === 0 && <li className="text-muted-foreground">Nothing sent yet.</li>}
          {deliveries?.map((delivery) => (
            <li key={delivery.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <Badge variant={delivery.status === 'SENT' ? 'secondary' : 'destructive'}>{delivery.status === 'SENT' ? 'Sent' : 'Failed'}</Badge>
              <span className="font-mono text-xs">{delivery.event}</span>
              <span className="text-xs text-muted-foreground">{Format.relativeTime(delivery.createdAt)}</span>
              {delivery.error && <span className="min-w-0 truncate text-xs text-destructive">{delivery.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
