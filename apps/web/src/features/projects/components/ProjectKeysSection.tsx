import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Format } from '@/lib/format';
import { useAddKey, useRemoveKey, useSetKeyActive } from '../hooks/useProjectMutations';
import type { Project } from '../types/project.types';

interface ProjectKeysSectionProps {
  project: Project;
}

export function ProjectKeysSection({ project }: ProjectKeysSectionProps) {
  const addKey = useAddKey(project.id);
  const setActive = useSetKeyActive(project.id);
  const removeKey = useRemoveKey(project.id);
  const onlyKey = project.keys.length <= 1;

  return (
    <section aria-labelledby="keys-heading" className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="keys-heading" className="text-lg font-semibold">
            Keys and DSN
          </h2>
          <p className="text-sm text-muted-foreground">
            Your apps use a DSN to send errors here. Create a key per app or environment so you can revoke
            one without touching the others.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={addKey.isPending}
          onClick={() =>
            addKey.mutate(`Key ${project.keys.length + 1}`, {
              onSuccess: () => toast.success('Key created'),
              onError: (error) => toast.error(error.message),
            })
          }
        >
          <Plus className="size-4" /> New key
        </Button>
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {project.keys.map((key) => (
          <li key={key.id} className="grid grid-cols-1 gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{key.label}</p>
                <p className="text-xs text-muted-foreground">Created {Format.shortDate(key.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={key.active}
                    onCheckedChange={(active) =>
                      setActive.mutate(
                        { keyId: key.id, active },
                        { onError: (error) => toast.error(error.message) },
                      )
                    }
                    aria-label={`${key.label} is ${key.active ? 'accepting' : 'blocked from sending'} events`}
                  />
                  <span className="hidden sm:inline">{key.active ? 'Active' : 'Disabled'}</span>
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={onlyKey || removeKey.isPending}
                  aria-label={`Delete ${key.label}`}
                  title={onlyKey ? 'A project needs at least one key' : 'Delete key'}
                  onClick={() => {
                    if (window.confirm(`Delete "${key.label}"? Apps using it will stop reporting.`)) {
                      removeKey.mutate(key.id, { onError: (error) => toast.error(error.message) });
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="scroll-x min-w-0 flex-1 rounded-md bg-muted px-3 py-2 font-mono text-xs">
                {key.dsn}
              </code>
              <CopyButton value={key.dsn} label="Copy DSN" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
