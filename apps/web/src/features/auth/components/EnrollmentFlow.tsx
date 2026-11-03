import { ArrowLeft, KeyRound, Loader2, Mail, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useBeginTotp,
  useConfirmEmailMethod,
  useConfirmTotp,
  useRegisterPasskey,
  useSendEmailCode,
} from '../hooks/useAuthMutations';
import { useAuthStatus } from '../hooks/useAuthQueries';
import type { EnrollmentResult, MfaMethod } from '../types/auth.types';
import { CodeField } from './CodeField';
import { RecoveryCodesStep } from './RecoveryCodesStep';

type Step = 'choose' | MfaMethod | 'codes';

interface EnrollmentFlowProps {
  enabled?: MfaMethod[];
  onDone: () => void;
  doneLabel?: string;
}

export function EnrollmentFlow({ enabled = [], onDone, doneLabel }: EnrollmentFlowProps) {
  const [step, setStep] = useState<Step>('choose');
  const [codes, setCodes] = useState<string[]>([]);
  const { data: status } = useAuthStatus();

  const finish = (result: EnrollmentResult): void => {
    if (result.recoveryCodes) {
      setCodes(result.recoveryCodes);
      setStep('codes');
      return;
    }
    toast.success('Two-step verification updated');
    onDone();
  };

  if (step === 'codes') {
    return <RecoveryCodesStep codes={codes} onDone={onDone} doneLabel={doneLabel} />;
  }
  if (step === 'choose') {
    return (
      <MethodChoice
        enabled={enabled}
        emailAvailable={status?.emailCodeAvailable ?? false}
        onChoose={setStep}
      />
    );
  }

  return (
    <div className="grid gap-5">
      <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setStep('choose')}>
        <ArrowLeft className="size-4" /> Choose another method
      </Button>
      {step === 'TOTP' && <TotpStep onEnrolled={finish} />}
      {step === 'PASSKEY' && <PasskeyStep onEnrolled={finish} />}
      {step === 'EMAIL' && <EmailStep onEnrolled={finish} />}
    </div>
  );
}

interface MethodChoiceProps {
  enabled: MfaMethod[];
  emailAvailable: boolean;
  onChoose: (method: MfaMethod) => void;
}

function MethodChoice({ enabled, emailAvailable, onChoose }: MethodChoiceProps) {
  const options: { method: MfaMethod; icon: typeof Smartphone; title: string; text: string; disabled?: string }[] = [
    {
      method: 'TOTP',
      icon: Smartphone,
      title: 'Authenticator app',
      text: 'Use Google Authenticator, 1Password, Authy or any TOTP app on your phone.',
    },
    {
      method: 'PASSKEY',
      icon: KeyRound,
      title: 'Passkey',
      text: 'Sign in with your fingerprint, face or device PIN, or a hardware security key.',
    },
    {
      method: 'EMAIL',
      icon: Mail,
      title: 'Code by email',
      text: 'We email you a one-time code each time you sign in.',
      disabled: emailAvailable ? undefined : 'Add SMTP settings to this server to enable email codes.',
    },
  ];

  return (
    <ul className="grid gap-3">
      {options.map(({ method, icon: Icon, title, text, disabled }) => (
        <li key={method}>
          <button
            type="button"
            disabled={Boolean(disabled)}
            onClick={() => onChoose(method)}
            className="flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
          >
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
              <Icon className="size-4" />
            </span>
            <span className="grid gap-0.5">
              <span className="font-medium">
                {title}
                {enabled.includes(method) && (
                  <span className="ml-2 text-xs font-normal text-moss">Enabled</span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">{disabled ?? text}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TotpStep({ onEnrolled }: { onEnrolled: (result: EnrollmentResult) => void }) {
  const begin = useBeginTotp();
  const confirm = useConfirmTotp();
  const [code, setCode] = useState('');
  const started = useRef(false);
  const enrollment = begin.data;

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    begin.mutate();
  }, [begin]);

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold">Set up your authenticator app</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan the QR code with your app, then enter the 6-digit code it shows.
        </p>
      </div>
      {begin.isError && <p className="text-sm text-destructive">{begin.error.message}</p>}
      {enrollment ? (
        <>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <img
              src={enrollment.qrCodeDataUrl}
              alt="QR code to add Watchdog to your authenticator app"
              className="size-44 rounded-lg border bg-white p-2"
            />
            <div className="min-w-0 text-sm">
              <p className="text-muted-foreground">Cannot scan? Enter this key instead:</p>
              <code className="mt-1 block break-all rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                {enrollment.secret}
              </code>
            </div>
          </div>
          <CodeField
            value={code}
            onChange={setCode}
            disabled={confirm.isPending}
            onComplete={(value) =>
              confirm.mutate(value, {
                onSuccess: onEnrolled,
                onError: (error) => {
                  setCode('');
                  toast.error(error.message);
                },
              })
            }
          />
        </>
      ) : (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      )}
    </div>
  );
}

function PasskeyStep({ onEnrolled }: { onEnrolled: (result: EnrollmentResult) => void }) {
  const register = useRegisterPasskey();
  const [name, setName] = useState('');

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold">Add a passkey</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your browser will ask you to confirm with a fingerprint, face, PIN or security key.
        </p>
      </div>
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name, for example “Work laptop”"
        maxLength={60}
        aria-label="Passkey name"
      />
      <Button
        size="lg"
        disabled={register.isPending}
        onClick={() =>
          register.mutate(name.trim() || undefined, {
            onSuccess: onEnrolled,
            onError: (error) => toast.error(error.message || 'Passkey setup was cancelled'),
          })
        }
      >
        {register.isPending && <Loader2 className="size-4 animate-spin" />}
        Create passkey
      </Button>
    </div>
  );
}

function EmailStep({ onEnrolled }: { onEnrolled: (result: EnrollmentResult) => void }) {
  const send = useSendEmailCode();
  const confirm = useConfirmEmailMethod();
  const [code, setCode] = useState('');
  const sent = send.isSuccess;

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold">Verify codes by email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We will send a test code to your address to make sure it works.
        </p>
      </div>
      {sent ? (
        <CodeField
          value={code}
          onChange={setCode}
          disabled={confirm.isPending}
          onComplete={(value) =>
            confirm.mutate(value, {
              onSuccess: onEnrolled,
              onError: (error) => {
                setCode('');
                toast.error(error.message);
              },
            })
          }
        />
      ) : (
        <Button
          size="lg"
          disabled={send.isPending}
          onClick={() => send.mutate(undefined, { onError: (error) => toast.error(error.message) })}
        >
          {send.isPending && <Loader2 className="size-4 animate-spin" />}
          Send test code
        </Button>
      )}
    </div>
  );
}
