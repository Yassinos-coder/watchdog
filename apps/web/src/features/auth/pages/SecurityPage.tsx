import { KeyRound, Loader2, Mail, Plus, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Format } from '@/lib/format';
import { AppUrlMismatchBanner } from '../components/AppUrlMismatchBanner';
import { PasswordSection } from '../components/PasswordSection';
import { EnrollmentFlow } from '../components/EnrollmentFlow';
import { RecoveryCodesStep } from '../components/RecoveryCodesStep';
import {
  useDisableMethod,
  useRegenerateRecoveryCodes,
  useRemovePasskey,
} from '../hooks/useAuthMutations';
import { useAuthSession, useSecuritySummary } from '../hooks/useAuthQueries';

export function SecurityPage() {
  const { data: session } = useAuthSession();
  const { data: summary, isLoading, error, refetch } = useSecuritySummary();
  const removePasskey = useRemovePasskey();
  const disableMethod = useDisableMethod();
  const regenerate = useRegenerateRecoveryCodes();
  const [adding, setAdding] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (error || !summary) {
    return <ErrorState message={error?.message ?? 'Could not load security settings'} onRetry={() => void refetch()} />;
  }

  const fail = (failure: Error): void => {
    toast.error(failure.message);
  };

  return (
    <>
      <PageHeader
        title="Security"
        description={`Signed in as ${session?.user?.email ?? ''}. Manage how you prove it's you when you sign in.`}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add a method
          </Button>
        }
      />

      <div className="grid max-w-3xl grid-cols-1 gap-10 [&>*]:min-w-0">
        <AppUrlMismatchBanner mismatch={summary.appUrlMismatch} />
        <PasswordSection />
        <section aria-labelledby="methods-heading" className="grid grid-cols-1 gap-3">
          <h2 id="methods-heading" className="text-lg font-semibold">
            Two-step verification
          </h2>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {summary.methods.includes('TOTP') && (
              <MethodRow
                icon={Smartphone}
                title="Authenticator app"
                detail="Time-based codes from your phone"
                busy={disableMethod.isPending}
                onRemove={() => disableMethod.mutate('TOTP', { onSuccess: () => toast.success('Authenticator app removed'), onError: fail })}
              />
            )}
            {summary.methods.includes('EMAIL') && (
              <MethodRow
                icon={Mail}
                title="Code by email"
                detail={session?.user?.email ?? ''}
                busy={disableMethod.isPending}
                onRemove={() => disableMethod.mutate('EMAIL', { onSuccess: () => toast.success('Email codes turned off'), onError: fail })}
              />
            )}
            {summary.passkeys.map((passkey) => (
              <MethodRow
                key={passkey.id}
                icon={KeyRound}
                title={passkey.name}
                detail={`Passkey · added ${Format.shortDate(passkey.createdAt)}${passkey.lastUsedAt ? ` · last used ${Format.relativeTime(passkey.lastUsedAt)}` : ''}`}
                busy={removePasskey.isPending}
                onRemove={() => removePasskey.mutate(passkey.id, { onSuccess: () => toast.success('Passkey removed'), onError: fail })}
              />
            ))}
            {summary.methods.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                No second step yet. Add one to protect your account.
              </li>
            )}
          </ul>
        </section>

        <section aria-labelledby="recovery-heading" className="grid grid-cols-1 gap-3">
          <h2 id="recovery-heading" className="text-lg font-semibold">
            Recovery codes
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <p className="text-sm">
              <strong>{summary.recoveryCodesRemaining}</strong> unused{' '}
              {summary.recoveryCodesRemaining === 1 ? 'code' : 'codes'} left.
              <span className="block text-muted-foreground">Making new codes invalidates the old ones.</span>
            </p>
            <Button
              variant="outline"
              disabled={regenerate.isPending || summary.methods.length === 0}
              onClick={() =>
                regenerate.mutate(undefined, {
                  onSuccess: (result) => setCodes(result.recoveryCodes),
                  onError: fail,
                })
              }
            >
              {regenerate.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Make new codes
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a verification method</DialogTitle>
            <DialogDescription>You can use any of your methods when you sign in.</DialogDescription>
          </DialogHeader>
          {adding && <EnrollmentFlow enabled={summary.methods} onDone={() => setAdding(false)} doneLabel="Done" />}
        </DialogContent>
      </Dialog>

      <Dialog open={codes !== null} onOpenChange={(open) => !open && setCodes(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your new recovery codes</DialogTitle>
          </DialogHeader>
          {codes && <RecoveryCodesStep codes={codes} onDone={() => setCodes(null)} doneLabel="Done" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MethodRowProps {
  icon: typeof Smartphone;
  title: string;
  detail: string;
  busy: boolean;
  onRemove: () => void;
}

function MethodRow({ icon: Icon, title, detail, busy, onRemove }: MethodRowProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{detail}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={busy}
        aria-label={`Remove ${title}`}
        onClick={() => {
          if (window.confirm(`Remove ${title}?`)) onRemove();
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
