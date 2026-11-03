import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FieldRow } from '@/components/FieldRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { useAcceptInvite } from '../hooks/useTeamMutations';
import { useInvitePreview } from '../hooks/useTeamQueries';
import { acceptInviteSchema, type AcceptInviteFormValues } from '../schemas/team.schemas';

export function AcceptInvitePage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { data: preview, isLoading, error } = useInvitePreview(token);
  const accept = useAcceptInvite();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormValues>({ resolver: zodResolver(acceptInviteSchema) });

  if (isLoading) {
    return null;
  }
  if (error || !preview) {
    return (
      <AuthLayout title="Invite not valid" description="This invite is invalid, expired or already used.">
        <Button asChild variant="outline">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </AuthLayout>
    );
  }

  const onSubmit = handleSubmit((values) => {
    accept.mutate(
      { token, name: values.name, password: values.password },
      {
        onSuccess: (session) =>
          navigate(session.user?.needsMfaSetup ? '/security/setup' : '/', { replace: true }),
        onError: (mutationError) => toast.error(mutationError.message),
      },
    );
  });

  return (
    <AuthLayout
      title="Join Watchdog"
      description={`${preview.invitedByName ?? 'An admin'} invited ${preview.email} as ${preview.role.toLowerCase()}.`}
    >
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FieldRow label="Your name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register('name')} />
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
        <Button type="submit" size="lg" disabled={accept.isPending} className="mt-2">
          {accept.isPending && <Loader2 className="size-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
