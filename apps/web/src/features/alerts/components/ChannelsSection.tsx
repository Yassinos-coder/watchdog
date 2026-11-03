import { Loader2, Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { CHANNEL_META } from '../constants/alert.constants';
import { useDeleteChannel, useTestChannel, useUpdateChannel } from '../hooks/useAlertMutations';
import { useChannels } from '../hooks/useAlertQueries';
import { useCanManage } from '../hooks/useCanManage';
import { ChannelDialog } from './ChannelDialog';

export function ChannelsSection() {
  const { data: channels, isLoading } = useChannels();
  const canManage = useCanManage();
  const update = useUpdateChannel();
  const remove = useDeleteChannel();
  const test = useTestChannel();
  const [adding, setAdding] = useState(false);

  return (
    <section aria-labelledby="channels-heading" className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="channels-heading" className="text-lg font-semibold">
            Channels
          </h2>
          <p className="text-sm text-muted-foreground">
            Where alerts are delivered. Rules in each project choose which channels to use.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add channel
          </Button>
        )}
      </div>

      {isLoading && <Skeleton className="h-24 w-full" />}
      {channels && channels.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No channels yet. Add one to start receiving alerts.
        </p>
      )}
      {channels && channels.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {channels.map((channel) => {
            const { icon: Icon, label } = CHANNEL_META[channel.type];
            return (
              <li key={channel.id} className="grid grid-cols-1 gap-3 p-4 sm:flex sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{channel.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {label} · <span className="font-mono text-xs">{channel.hint}</span>
                    </p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={test.isPending && test.variables === channel.id}
                      onClick={() =>
                        test.mutate(channel.id, {
                          onSuccess: () => toast.success(`Test alert sent to ${channel.name}`),
                          onError: (error) => toast.error(error.message),
                        })
                      }
                    >
                      {test.isPending && test.variables === channel.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Send test
                    </Button>
                    <Switch
                      checked={channel.enabled}
                      aria-label={`${channel.name} is ${channel.enabled ? 'on' : 'off'}`}
                      onCheckedChange={(enabled) =>
                        update.mutate({ channelId: channel.id, enabled }, { onError: (error) => toast.error(error.message) })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${channel.name}`}
                      onClick={() => {
                        if (window.confirm(`Delete "${channel.name}"? Rules using it will stop alerting through it.`)) {
                          remove.mutate(channel.id, { onError: (error) => toast.error(error.message) });
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ChannelDialog open={adding} onOpenChange={setAdding} />
    </section>
  );
}
