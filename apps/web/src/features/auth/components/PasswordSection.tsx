import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FieldRow } from '@/components/FieldRow';
import { Button } from '@/components/ui/button';
import { useChangePassword } from '@/features/settings/hooks/useSettingsMutations';
import { PasswordInput } from './PasswordInput';

export function PasswordSection() {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && confirm !== next;

  return (
    <section aria-labelledby="password-heading" className="grid grid-cols-1 gap-3">
      <div>
        <h2 id="password-heading" className="text-lg font-semibold">
          Password
        </h2>
        <p className="text-sm text-muted-foreground">
          Changing it signs you out everywhere else. At least 12 characters works best.
        </p>
      </div>
      <form
        className="grid gap-4 rounded-xl border bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          change.mutate(
            { currentPassword: current, newPassword: next },
            {
              onSuccess: () => {
                setCurrent('');
                setNext('');
                setConfirm('');
                toast.success('Password updated. Other sessions were signed out.');
              },
              onError: (failure) => toast.error(failure.message),
            },
          );
        }}
      >
        <FieldRow label="Current password" htmlFor="password-current">
          <PasswordInput id="password-current" value={current} onChange={(event) => setCurrent(event.target.value)} autoComplete="current-password" />
        </FieldRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="New password" htmlFor="password-new">
            <PasswordInput id="password-new" value={next} onChange={(event) => setNext(event.target.value)} autoComplete="new-password" />
          </FieldRow>
          <FieldRow label="Repeat new password" htmlFor="password-confirm" error={mismatch ? 'The passwords do not match' : undefined}>
            <PasswordInput id="password-confirm" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
          </FieldRow>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={!current || !next || next !== confirm || change.isPending}>
            {change.isPending && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </div>
      </form>
    </section>
  );
}
