import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DocsLink } from '@/components/DocsLink';
import { FieldRow } from '@/components/FieldRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useClearSmtp, useSaveSmtp, useSendTestEmail } from '../hooks/useAlertMutations';
import { useSmtpSettings } from '../hooks/useAlertQueries';
import { useCanManage } from '../hooks/useCanManage';

const DEFAULT_PORT = 587;

export function SmtpSection() {
  const { data: smtp, isLoading, error } = useSmtpSettings();
  const canManage = useCanManage();
  const save = useSaveSmtp();
  const clear = useClearSmtp();
  const sendTest = useSendTestEmail();
  const [host, setHost] = useState('');
  const [port, setPort] = useState(String(DEFAULT_PORT));
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [from, setFrom] = useState('');
  const [testAddress, setTestAddress] = useState('');

  useEffect(() => {
    if (!smtp) return;
    setHost(smtp.host ?? '');
    setPort(String(smtp.port ?? DEFAULT_PORT));
    setSecure(smtp.secure ?? false);
    setUser(smtp.user ?? '');
    setFrom(smtp.from ?? '');
    setPassword('');
  }, [smtp]);

  if (!canManage || error) {
    return null;
  }

  const sourceText =
    smtp?.source === 'database'
      ? 'Using the settings saved here.'
      : smtp?.source === 'environment'
        ? 'Using the SMTP_* environment variables. Save settings here to override them.'
        : 'Not set up yet. Email channels and email sign-in codes need this.';

  return (
    <section aria-labelledby="smtp-heading" className="grid grid-cols-1 gap-4">
      <div>
        <h2 id="smtp-heading" className="text-lg font-semibold">
          Email (SMTP)
        </h2>
        <p className="text-sm text-muted-foreground">{sourceText}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <form
          className="grid grid-cols-1 gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              {
                host: host.trim(),
                port: Number(port),
                secure,
                user: user.trim() || undefined,
                password: password || undefined,
                from: from.trim(),
              },
              {
                onSuccess: () => toast.success('Email settings saved'),
                onError: (failure) => toast.error(failure.message),
              },
            );
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <FieldRow label="Host" htmlFor="smtp-host">
              <Input id="smtp-host" value={host} onChange={(event) => setHost(event.target.value)} placeholder="smtp.example.com" />
            </FieldRow>
            <FieldRow label="Port" htmlFor="smtp-port">
              <Input id="smtp-port" value={port} onChange={(event) => setPort(event.target.value)} inputMode="numeric" />
            </FieldRow>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={secure} onCheckedChange={setSecure} />
            Use TLS from the start (turn on for port 465, off for 587)
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Username" htmlFor="smtp-user">
              <Input id="smtp-user" value={user} onChange={(event) => setUser(event.target.value)} autoComplete="off" />
            </FieldRow>
            <FieldRow
              label="Password"
              htmlFor="smtp-password"
              hint={smtp?.hasPassword ? 'A password is saved. Leave this empty to keep it.' : undefined}
            >
              <Input
                id="smtp-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </FieldRow>
          </div>
          <FieldRow label="From address" htmlFor="smtp-from">
            <Input id="smtp-from" value={from} onChange={(event) => setFrom(event.target.value)} placeholder="Watchdog <alerts@example.com>" />
          </FieldRow>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={save.isPending || !host.trim() || !from.trim()}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
            {smtp?.source === 'database' && (
              <Button
                type="button"
                variant="outline"
                disabled={clear.isPending}
                onClick={() => clear.mutate(undefined, { onSuccess: () => toast.success('Using environment settings'), onError: (failure) => toast.error(failure.message) })}
              >
                Use environment settings
              </Button>
            )}
            <DocsLink path="alerts/email#add-your-smtp-settings">Setup guide for email</DocsLink>
          </div>
        </form>
      )}

      {smtp?.configured && (
        <div className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-end">
          <FieldRow label="Send a test email to" htmlFor="smtp-test" className="flex-1">
            <Input id="smtp-test" type="email" value={testAddress} onChange={(event) => setTestAddress(event.target.value)} placeholder="you@example.com" />
          </FieldRow>
          <Button
            variant="outline"
            disabled={!testAddress.trim() || sendTest.isPending}
            onClick={() =>
              sendTest.mutate(testAddress.trim(), {
                onSuccess: () => toast.success('Test email sent'),
                onError: (failure) => toast.error(failure.message),
              })
            }
          >
            {sendTest.isPending && <Loader2 className="size-4 animate-spin" />}
            Send test email
          </Button>
        </div>
      )}
    </section>
  );
}
