import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FieldRow } from '@/components/FieldRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { useLogin } from '../hooks/useAuthMutations';
import { useAuthSession, useAuthStatus } from '../hooks/useAuthQueries';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const { data: status, isLoading: statusLoading } = useAuthStatus();
  const { data: session, isLoading: sessionLoading } = useAuthSession();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  if (statusLoading || sessionLoading) {
    return null;
  }
  if (status?.setupRequired) {
    return <Navigate to="/setup" replace />;
  }
  if (session?.mfaRequired) {
    return <Navigate to="/login/verify" replace />;
  }
  if (session?.user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (result) =>
        navigate(result.mfaRequired ? '/login/verify' : result.user?.needsMfaSetup ? '/security/setup' : '/', {
          replace: true,
        }),
      onError: (error) => toast.error(error.message),
    });
  });

  return (
    <AuthLayout title="Sign in" description="Use the account you created when you set up Watchdog.">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FieldRow label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="username" inputMode="email" {...register('email')} />
        </FieldRow>
        <FieldRow label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" {...register('password')} />
        </FieldRow>
        <Button type="submit" size="lg" disabled={login.isPending} className="mt-2">
          {login.isPending && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
