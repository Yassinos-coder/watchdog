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
import { useSetup } from '../hooks/useAuthMutations';
import { useAuthStatus } from '../hooks/useAuthQueries';
import { setupSchema, type SetupFormValues } from '../schemas/auth.schemas';

export function SetupPage() {
  const navigate = useNavigate();
  const { data: status, isLoading } = useAuthStatus();
  const setup = useSetup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormValues>({ resolver: zodResolver(setupSchema) });

  if (isLoading) {
    return null;
  }
  if (status && !status.setupRequired) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = handleSubmit((values) => {
    const { confirmPassword: _confirm, ...input } = values;
    setup.mutate(input, {
      onSuccess: () => navigate('/security/setup', { replace: true }),
      onError: (error) => toast.error(error.message),
    });
  });

  return (
    <AuthLayout
      title="Set up Watchdog"
      description="Create the owner account for this instance. You will add two-step verification next."
    >
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FieldRow
          label="Setup token"
          htmlFor="setupToken"
          error={errors.setupToken?.message}
          hint="Printed in the server log on first start, or the SETUP_TOKEN you configured."
        >
          <Input id="setupToken" autoComplete="off" spellCheck={false} {...register('setupToken')} />
        </FieldRow>
        <FieldRow label="Your name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register('name')} />
        </FieldRow>
        <FieldRow label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" inputMode="email" {...register('email')} />
        </FieldRow>
        <FieldRow
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 12 characters. A passphrase works well."
        >
          <PasswordInput id="password" autoComplete="new-password" {...register('password')} />
        </FieldRow>
        <FieldRow label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" {...register('confirmPassword')} />
        </FieldRow>
        <Button type="submit" size="lg" disabled={setup.isPending} className="mt-2">
          {setup.isPending && <Loader2 className="size-4 animate-spin" />}
          Create owner account
        </Button>
      </form>
    </AuthLayout>
  );
}
