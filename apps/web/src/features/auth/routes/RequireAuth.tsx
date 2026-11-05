import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ApiError, IP_BANNED_CODE } from '@/services/BaseApiClient';
import { useAuthSession } from '../hooks/useAuthQueries';

export function RequireAuth() {
  const location = useLocation();
  const { data: session, isLoading, error } = useAuthSession();

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
        <Logo className="animate-pulse" />
      </div>
    );
  }
  if (error) {
    const banned = error instanceof ApiError && error.code === IP_BANNED_CODE;
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-md">
          <Logo className="mb-4 justify-center" />
          <p className="font-medium">
            {banned ? 'Access temporarily blocked' : 'Cannot reach the Watchdog server'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (session.mfaRequired) {
    return <Navigate to="/login/verify" replace />;
  }
  if (session.user?.needsMfaSetup) {
    return <Navigate to="/security/setup" replace />;
  }
  return <Outlet />;
}
