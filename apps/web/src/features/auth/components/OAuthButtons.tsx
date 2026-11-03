import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useOAuthProviders } from '../hooks/useAuthQueries';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export function OAuthButtons() {
  const { data: providers } = useOAuthProviders();
  const [params, setParams] = useSearchParams();
  const failed = params.get('oauth') === 'failed';

  useEffect(() => {
    if (!failed) return;
    toast.error('Sign-in failed. Ask an admin to invite the email on that account.');
    setParams({}, { replace: true });
  }, [failed, setParams]);

  if (!providers || providers.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 grid gap-2">
      <p className="text-center text-xs text-muted-foreground">or continue with</p>
      {providers.map((provider) => (
        <Button key={provider.id} asChild variant="outline" size="lg">
          <a href={`${API_BASE}/oauth/${provider.id}/start`}>{provider.label}</a>
        </Button>
      ))}
    </div>
  );
}
