import { Laptop, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Format } from '@/lib/format';
import { useRevokeOtherSessions, useRevokeSession } from '../hooks/useSettingsMutations';
import { useSessions } from '../hooks/useSettingsQueries';
import { SessionUtils } from '../utils/session.utils';

export function SessionsPage() {
  const { data: sessions, isLoading, error, refetch } = useSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const others = sessions?.filter((session) => !session.current) ?? [];

  return (
    <>
      <PageHeader
        title="Sessions"
        description="Browsers and devices that are signed in to your account right now."
        actions={
          others.length > 0 ? (
            <Button
              variant="outline"
              disabled={revokeOthers.isPending}
              onClick={() =>
                revokeOthers.mutate(undefined, {
                  onSuccess: () => toast.success('Signed out everywhere else'),
                  onError: (failure) => toast.error(failure.message),
                })
              }
            >
              {revokeOthers.isPending && <Loader2 className="size-4 animate-spin" />}
              Sign out everywhere else
            </Button>
          ) : undefined
        }
      />
      {isLoading && <Skeleton className="h-40 w-full" />}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {sessions && (
        <ul className="grid max-w-3xl divide-y overflow-hidden rounded-xl border bg-card">
          {sessions.map((session) => {
            const Icon = SessionUtils.isMobile(session.userAgent) ? Smartphone : Laptop;
            return (
              <li key={session.id} className="flex items-center gap-4 p-4">
                <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {SessionUtils.describe(session.userAgent)}
                    {session.current && (
                      <Badge variant="secondary" className="ml-2 align-middle">
                        This device
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {session.ip ?? 'Unknown address'} · signed in {Format.dateTime(session.createdAt)}
                  </p>
                </div>
                {!session.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(session.id, { onError: (failure) => toast.error(failure.message) })}
                  >
                    Sign out
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
