import { Loader2, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CodeSnippet } from '@/components/CodeSnippet';
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
import { useCreateApiKey, useUpdateApiKey } from '../hooks/useMcp';
import type { ApiKeyInfo, CreatedApiKey, McpConfig } from '../types/mcp.types';
import { ConnectSnippets } from './ConnectSnippets';
import { PermissionPicker } from './PermissionPicker';

interface KeyDialogProps {
  open: boolean;
  config: McpConfig;
  editing: ApiKeyInfo | null;
  onOpenChange: (open: boolean) => void;
}

export function KeyDialog({ open, config, editing, onOpenChange }: KeyDialogProps) {
  const create = useCreateApiKey();
  const update = useUpdateApiKey();
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setPermissions(editing?.permissions ?? config.defaults);
    setCreated(null);
  }, [open, editing, config.defaults]);

  const pending = create.isPending || update.isPending;
  const hasWrites = config.permissions.some((permission) => permission.writes && permissions.includes(permission.id));

  const submit = (): void => {
    if (editing) {
      update.mutate(
        { keyId: editing.id, changes: { name: name.trim(), permissions } },
        {
          onSuccess: () => {
            toast.success('Key updated');
            onOpenChange(false);
          },
          onError: (failure) => toast.error(failure.message),
        },
      );
      return;
    }
    create.mutate(
      { name: name.trim(), permissions },
      { onSuccess: setCreated, onError: (failure) => toast.error(failure.message) },
    );
  };

  if (created) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your API key</DialogTitle>
            <DialogDescription>
              Copy it now. For your safety it is shown only once, and Watchdog stores just a fingerprint of it.
            </DialogDescription>
          </DialogHeader>
          <CodeSnippet code={created.key} />
          <ConnectSnippets url={config.url} apiKey={created.key} />
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>I have copied it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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
            <DialogTitle>{editing ? 'Edit API key' : 'Create an API key'}</DialogTitle>
            <DialogDescription>Choose what an AI assistant using this key is allowed to do.</DialogDescription>
          </DialogHeader>
          <FieldRow label="Name" htmlFor="key-name" hint="So you remember where it is used, for example Claude Code on my laptop.">
            <Input id="key-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoFocus />
          </FieldRow>
          <PermissionPicker permissions={config.permissions} selected={permissions} onChange={setPermissions} />
          {hasWrites && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
              This key can change data or hand out credentials. Only give it to assistants and machines you trust.
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending || name.trim().length === 0 || permissions.length === 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? 'Save changes' : 'Create key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
