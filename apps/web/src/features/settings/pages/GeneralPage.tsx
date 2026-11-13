import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DocsLink } from '@/components/DocsLink';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstance } from '../hooks/useSettingsQueries';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

function Status({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {on ? <Check className="size-4 text-emerald-600" /> : <X className="size-4 text-muted-foreground" />}
      {children}
    </span>
  );
}

export function GeneralPage() {
  const { data: instance, isLoading, error, refetch } = useInstance();

  return (
    <>
      <PageHeader title="General" description="This Watchdog instance and how it is set up." />
      {isLoading && <Skeleton className="h-56 w-full" />}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {instance && (
        <div className="grid max-w-3xl gap-6">
          <dl className="divide-y overflow-hidden rounded-xl border bg-card">
            <Row label="Version">{instance.version}</Row>
            <Row label="Address">
              <span className="font-mono">{instance.appUrl}</span>
              {!instance.appUrlExplicit && (
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Taken from your hosting provider. Set <span className="font-mono">APP_URL</span> to pin it before you add passkeys.
                </span>
              )}
            </Row>
            <Row label="Update checks">
              <Status on={instance.updateChecks}>{instance.updateChecks ? 'On' : 'Off'}</Status>
            </Row>
            <Row label="Sign in with Google">
              <Status on={instance.signIn.google}>{instance.signIn.google ? 'Configured' : 'Not configured'}</Status>
            </Row>
            <Row label="Sign in with GitHub">
              <Status on={instance.signIn.github}>{instance.signIn.github ? 'Configured' : 'Not configured'}</Status>
            </Row>
          </dl>
          <p className="text-sm text-muted-foreground">
            Email delivery and alert channels live under <Link to="/integrations" className="underline underline-offset-4">Integrations</Link>.{' '}
            <DocsLink path="configuration">All settings</DocsLink>
          </p>
        </div>
      )}
    </>
  );
}
