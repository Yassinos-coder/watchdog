import { KeyRound, Loader2, Mail, Smartphone, LifeBuoy } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthLayout } from '../components/AuthLayout';
import { CodeField } from '../components/CodeField';
import {
  useLogout,
  usePasskeySignIn,
  useSendEmailCode,
  useVerifyMfa,
} from '../hooks/useAuthMutations';
import { useAuthSession } from '../hooks/useAuthQueries';
import type { AuthSession, MfaMethod, VerifyMethod } from '../types/auth.types';

type ChallengeTab = 'totp' | 'passkey' | 'email' | 'recovery';

const TAB_FOR_METHOD: Record<MfaMethod, ChallengeTab> = {
  TOTP: 'totp',
  PASSKEY: 'passkey',
  EMAIL: 'email',
};

export function MfaChallengePage() {
  const { data: session, isLoading } = useAuthSession();

  if (isLoading) {
    return null;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (!session.mfaRequired) {
    return <Navigate to="/" replace />;
  }
  return <ChallengeForm session={session} />;
}

function ChallengeForm({ session }: { session: AuthSession }) {
  const navigate = useNavigate();
  const verify = useVerifyMfa();
  const passkey = usePasskeySignIn();
  const sendEmail = useSendEmailCode();
  const logout = useLogout();
  const tabs: ChallengeTab[] = [...session.methods.map((method) => TAB_FOR_METHOD[method]), 'recovery'];
  const [tab, setTab] = useState<ChallengeTab>(tabs[0]);
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const finish = (result: AuthSession): void => {
    navigate(result.user?.needsMfaSetup ? '/security/setup' : '/', { replace: true });
  };

  const submit = (method: VerifyMethod, value: string): void => {
    verify.mutate(
      { method, code: value },
      {
        onSuccess: finish,
        onError: (error) => {
          setCode('');
          toast.error(error.message);
        },
      },
    );
  };

  const signInWithPasskey = (): void => {
    passkey.mutate(undefined, {
      onSuccess: finish,
      onError: (error) => toast.error(error.message || 'Passkey sign-in was cancelled'),
    });
  };

  const sendEmailCode = (): void => {
    sendEmail.mutate(undefined, {
      onSuccess: () => {
        setEmailSent(true);
        toast.success('We sent a code to your email');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const cancel = (): void => {
    logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });
  };

  return (
    <AuthLayout
      title="Verify it's you"
      description="Finish signing in with your second step."
      footer={
        <button type="button" onClick={cancel} className="underline underline-offset-4 hover:text-foreground">
          Use a different account
        </button>
      }
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as ChallengeTab)}>
        <TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-1">
          {tabs.includes('totp') && (
            <TabsTrigger value="totp" className="gap-1.5">
              <Smartphone className="size-4" /> App
            </TabsTrigger>
          )}
          {tabs.includes('passkey') && (
            <TabsTrigger value="passkey" className="gap-1.5">
              <KeyRound className="size-4" /> Passkey
            </TabsTrigger>
          )}
          {tabs.includes('email') && (
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="size-4" /> Email
            </TabsTrigger>
          )}
          <TabsTrigger value="recovery" className="gap-1.5">
            <LifeBuoy className="size-4" /> Recovery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="totp" className="grid gap-4">
          <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
          <CodeField
            value={code}
            onChange={setCode}
            onComplete={(value) => submit('totp', value)}
            disabled={verify.isPending}
          />
        </TabsContent>

        <TabsContent value="passkey" className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Use the passkey on this device, or a security key.
          </p>
          <Button size="lg" onClick={signInWithPasskey} disabled={passkey.isPending}>
            {passkey.isPending && <Loader2 className="size-4 animate-spin" />}
            Use passkey
          </Button>
        </TabsContent>

        <TabsContent value="email" className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            {emailSent ? 'Enter the 6-digit code we emailed you.' : 'We will email a one-time code to your address.'}
          </p>
          {emailSent ? (
            <>
              <CodeField
                value={code}
                onChange={setCode}
                onComplete={(value) => submit('email', value)}
                disabled={verify.isPending}
              />
              <Button variant="ghost" size="sm" onClick={sendEmailCode} disabled={sendEmail.isPending} className="justify-self-start">
                Send a new code
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={sendEmailCode} disabled={sendEmail.isPending}>
              {sendEmail.isPending && <Loader2 className="size-4 animate-spin" />}
              Email me a code
            </Button>
          )}
        </TabsContent>

        <TabsContent value="recovery" className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Lost your device? Enter one of your recovery codes. Each code works once.
          </p>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (recovery.trim()) submit('recovery', recovery.trim());
            }}
          >
            <Input
              value={recovery}
              onChange={(event) => setRecovery(event.target.value)}
              placeholder="xxxxx-xxxxx"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              aria-label="Recovery code"
            />
            <Button type="submit" size="lg" disabled={verify.isPending || !recovery.trim()}>
              {verify.isPending && <Loader2 className="size-4 animate-spin" />}
              Use recovery code
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
