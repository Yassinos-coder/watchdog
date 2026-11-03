import { useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { EnrollmentFlow } from '../components/EnrollmentFlow';
import { useAuthSession } from '../hooks/useAuthQueries';

export function MfaSetupPage() {
  const navigate = useNavigate();
  const { data: session, isLoading } = useAuthSession();
  const startedUnsecured = useRef<boolean | null>(null);

  if (isLoading) {
    return null;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (session.mfaRequired) {
    return <Navigate to="/login/verify" replace />;
  }
  if (session.user && startedUnsecured.current === null) {
    startedUnsecured.current = session.user.needsMfaSetup;
  }
  if (startedUnsecured.current === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout
      title="Secure your account"
      description="Administrators need a second step when signing in. Pick the method that suits you; you can add more later."
    >
      <EnrollmentFlow onDone={() => navigate('/', { replace: true })} doneLabel="Open Watchdog" />
    </AuthLayout>
  );
}
