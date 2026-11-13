import { TriangleAlert } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { McpPermission } from '../types/mcp.types';

interface PermissionPickerProps {
  permissions: McpPermission[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function PermissionPicker({ permissions, selected, onChange }: PermissionPickerProps) {
  const toggle = (id: string, checked: boolean): void =>
    onChange(checked ? [...selected, id] : selected.filter((entry) => entry !== id));

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">What this key may do</legend>
      {permissions.map((permission) => (
        <div
          key={permission.id}
          className="flex items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-accent/40"
        >
          <Checkbox
            id={`permission-${permission.id}`}
            className="mt-0.5"
            checked={selected.includes(permission.id)}
            onCheckedChange={(checked) => toggle(permission.id, checked === true)}
          />
          <div className="min-w-0">
            <Label htmlFor={`permission-${permission.id}`} className="flex flex-wrap items-center gap-2 font-medium">
              {permission.label}
              {permission.writes && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-700 dark:text-amber-400">
                  <TriangleAlert className="size-3" aria-hidden="true" /> Can change things
                </span>
              )}
            </Label>
            <p className="text-sm text-muted-foreground">{permission.description}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{permission.tools.join(' · ')}</p>
          </div>
        </div>
      ))}
    </fieldset>
  );
}
