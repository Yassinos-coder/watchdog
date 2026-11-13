import { Plus, Webhook as WebhookIcon } from 'lucide-react';
import { useState } from 'react';
import { DocsLink } from '@/components/DocsLink';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCanManage } from '@/features/alerts/hooks/useCanManage';
import { SecretDialog } from '../components/SecretDialog';
import { WebhookDialog } from '../components/WebhookDialog';
import { WebhookRow } from '../components/WebhookRow';
import { useWebhookConfig, useWebhooks } from '../hooks/useWebhooks';
import type { Webhook } from '../types/webhook.types';

export function WebhooksPage() {
  const { data: webhooks, isLoading, error, refetch } = useWebhooks();
  const { data: config } = useWebhookConfig();
  const canManage = useCanManage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const openNew = (): void => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Send a signed request to your own server when something happens in Watchdog, and choose which events you want."
        actions={
          canManage && webhooks && webhooks.length > 0 ? (
            <Button onClick={openNew}>
              <Plus className="size-4" /> Add webhook
            </Button>
          ) : undefined
        }
      />
      {isLoading && <Skeleton className="h-32 w-full" />}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {webhooks && webhooks.length === 0 && (
        <EmptyState
          icon={WebhookIcon}
          title="No webhooks yet"
          description="Add an address and pick the events to receive, such as new issues or metric alerts."
          action={canManage ? <Button onClick={openNew}>Add webhook</Button> : undefined}
        />
      )}
      {webhooks && webhooks.length > 0 && (
        <div className="grid max-w-3xl gap-3">
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {webhooks.map((webhook) => (
              <WebhookRow
                key={webhook.id}
                webhook={webhook}
                canManage={canManage}
                onEdit={(target) => {
                  setEditing(target);
                  setDialogOpen(true);
                }}
                onSecret={setSecret}
              />
            ))}
          </ul>
          <DocsLink path="webhooks">Payloads and signature checking</DocsLink>
        </div>
      )}
      {config && (
        <WebhookDialog open={dialogOpen} events={config.events} editing={editing} onOpenChange={setDialogOpen} onCreated={setSecret} />
      )}
      <SecretDialog secret={secret} onClose={() => setSecret(null)} />
    </>
  );
}
