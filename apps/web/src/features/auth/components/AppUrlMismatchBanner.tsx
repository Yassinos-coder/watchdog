import { TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { AppUrlMismatch } from '../types/auth.types';

interface AppUrlMismatchBannerProps {
  mismatch: AppUrlMismatch | null;
}

export function AppUrlMismatchBanner({ mismatch }: AppUrlMismatchBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (!mismatch || dismissed) {
    return null;
  }

  return (
    <Alert className="relative pr-12">
      <TriangleAlert />
      <AlertTitle>Passkeys will not work on this address</AlertTitle>
      <AlertDescription>
        <p>
          Watchdog is open on <strong>{mismatch.host}</strong> but APP_URL is{' '}
          <strong>{mismatch.configuredUrl}</strong>. Passkeys will fail until APP_URL is set to{' '}
          <strong>{mismatch.expectedUrl}</strong>.
        </p>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-7"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" />
      </Button>
    </Alert>
  );
}
