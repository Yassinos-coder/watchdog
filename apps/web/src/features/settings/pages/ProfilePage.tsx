import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';
import { FieldRow } from '@/components/FieldRow';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useChangeEmail, useUpdateName } from '../hooks/useSettingsMutations';

const ROLE_LABEL = { OWNER: 'Owner', ADMIN: 'Administrator', MEMBER: 'Member' } as const;

export function ProfilePage() {
  const { data: session } = useAuthSession();
  const user = session?.user;
  const updateName = useUpdateName();
  const changeEmail = useChangeEmail();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  if (!user) {
    return <Skeleton className="h-64 w-full" />;
  }

  const nameValue = name ?? user.name;
  const emailValue = email ?? user.email;
  const nameChanged = nameValue.trim() !== user.name && nameValue.trim().length > 0;
  const emailChanged = emailValue.trim().toLowerCase() !== user.email;

  return (
    <>
      <PageHeader title="Profile" description="How you appear in Watchdog and the address you sign in with." />

      <div className="grid max-w-xl gap-6">
        <form
          className="grid gap-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault();
            updateName.mutate(nameValue, {
              onSuccess: () => {
                setName(null);
                toast.success('Name updated');
              },
              onError: (failure) => toast.error(failure.message),
            });
          }}
        >
          <h2 className="text-lg font-semibold">Name</h2>
          <FieldRow label="Full name" htmlFor="profile-name">
            <Input id="profile-name" value={nameValue} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" />
          </FieldRow>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Your role: <span className="font-medium text-foreground">{ROLE_LABEL[user.role]}</span>
            </p>
            <Button type="submit" disabled={!nameChanged || updateName.isPending}>
              {updateName.isPending && <Loader2 className="size-4 animate-spin" />}
              Save name
            </Button>
          </div>
        </form>

        <form
          className="grid gap-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault();
            changeEmail.mutate(
              { email: emailValue, currentPassword: password },
              {
                onSuccess: () => {
                  setEmail(null);
                  setPassword('');
                  toast.success('Email address updated');
                },
                onError: (failure) => toast.error(failure.message),
              },
            );
          }}
        >
          <div>
            <h2 className="text-lg font-semibold">Email address</h2>
            <p className="text-sm text-muted-foreground">You sign in with this address, and security codes by email go to it.</p>
          </div>
          <FieldRow label="Email" htmlFor="profile-email">
            <Input id="profile-email" type="email" value={emailValue} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </FieldRow>
          {emailChanged && (
            <FieldRow label="Current password" htmlFor="profile-email-password" hint="Needed to confirm it is you.">
              <PasswordInput id="profile-email-password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </FieldRow>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={!emailChanged || password.length === 0 || changeEmail.isPending}>
              {changeEmail.isPending && <Loader2 className="size-4 animate-spin" />}
              Change email
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
