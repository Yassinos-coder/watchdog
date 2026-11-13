import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CodeSnippet } from '@/components/CodeSnippet';
import { DocsLink } from '@/components/DocsLink';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCanManage } from '@/features/alerts/hooks/useCanManage';
import { Format } from '@/lib/format';
import { KeyDialog } from '../components/KeyDialog';
import { useApiKeys, useMcpConfig, useRemoveApiKey } from '../hooks/useMcp';
import type { ApiKeyInfo } from '../types/mcp.types';

export function McpPage() {
  const { data: config, isLoading, error, refetch } = useMcpConfig();
  const { data: keys } = useApiKeys();
  const remove = useRemoveApiKey();
  const canManage = useCanManage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiKeyInfo | null>(null);

  const openNew = (): void => {
    setEditing(null);
    setDialogOpen(true);
  };

  if (error) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  }

  return (
    <>
      <PageHeader
        title="MCP"
        description="Let an AI assistant such as Claude read your issues, stack traces and metrics, and even set up new projects, through the Model Context Protocol."
        actions={
          canManage && keys && keys.length > 0 ? (
            <Button onClick={openNew}>
              <Plus className="size-4" /> Create API key
            </Button>
          ) : undefined
        }
      />

      {isLoading && <Skeleton className="h-40 w-full" />}
      {config && (
        <div className="grid max-w-3xl gap-8 [&>*]:min-w-0">
          <section aria-labelledby="mcp-url-heading" className="grid gap-3">
            <div>
              <h2 id="mcp-url-heading" className="text-lg font-semibold">
                Server address
              </h2>
              <p className="text-sm text-muted-foreground">
                Add this address to your assistant, together with an API key from below.
              </p>
            </div>
            <CodeSnippet code={config.url} />
            <p className="rounded-lg border border-dashed bg-card p-3 text-sm">
              Then just ask: <span className="font-medium">&ldquo;Use Watchdog to set up error tracking in this repo&rdquo;</span> or{' '}
              <span className="font-medium">&ldquo;Look at the latest issue in my backend and fix it.&rdquo;</span>
            </p>
            <DocsLink path="mcp">How to connect Claude and other assistants</DocsLink>
          </section>

          <section aria-labelledby="mcp-keys-heading" className="grid gap-3">
            <div>
              <h2 id="mcp-keys-heading" className="text-lg font-semibold">
                API keys
              </h2>
              <p className="text-sm text-muted-foreground">
                Each key has its own permissions. Delete a key to cut off access at once.
              </p>
            </div>
            {keys && keys.length === 0 && (
              <EmptyState
                icon={KeyRound}
                title="No API keys yet"
                description="Create a key, pick what it may do, and paste it into your assistant."
                action={canManage ? <Button onClick={openNew}>Create API key</Button> : undefined}
              />
            )}
            {keys && keys.length > 0 && (
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                {keys.map((key) => (
                  <li key={key.id} className="grid gap-3 p-4 sm:flex sm:items-start">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{key.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{key.prefix}…</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {key.permissions.map((permission) => {
                          const definition = config.permissions.find((entry) => entry.id === permission);
                          return (
                            <Badge key={permission} variant={definition?.writes ? 'destructive' : 'secondary'}>
                              {definition?.label ?? permission}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Created {Format.shortDate(key.createdAt)} ·{' '}
                        {key.lastUsedAt ? `last used ${Format.relativeTime(key.lastUsedAt)}` : 'never used'}
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${key.name}`}
                          onClick={() => {
                            setEditing(key);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${key.name}`}
                          onClick={() => {
                            if (window.confirm(`Delete the key "${key.name}"? Anything using it stops working immediately.`)) {
                              remove.mutate(key.id, { onError: (failure) => toast.error(failure.message) });
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
          </section>
        </div>
      )}
      {config && <KeyDialog open={dialogOpen} config={config} editing={editing} onOpenChange={setDialogOpen} />}
    </>
  );
}
