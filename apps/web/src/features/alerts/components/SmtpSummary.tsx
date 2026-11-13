import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmtpSettings } from '../hooks/useAlertQueries';
import { useCanManage } from '../hooks/useCanManage';

interface SmtpSummaryProps {
  onConfigure: () => void;
}

export function SmtpSummary({ onConfigure }: SmtpSummaryProps) {
  const { data: smtp } = useSmtpSettings();
  const canManage = useCanManage();

  if (!smtp) {
    return null;
  }

  const detail = smtp.configured
    ? `${smtp.host}:${smtp.port} · ${smtp.source === 'environment' ? 'from environment variables' : 'saved here'}`
    : 'Not set up yet. Email alerts and email sign-in codes need it.';

  return (
    <section aria-labelledby="smtp-heading" className="grid grid-cols-1 gap-3">
      <div>
        <h2 id="smtp-heading" className="text-lg font-semibold">
          Email server
        </h2>
        <p className="text-sm text-muted-foreground">Used for email channels and sign-in codes sent by email.</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
          <Server className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">SMTP</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{detail}</p>
        </div>
        {canManage && (
          <Button variant="outline" onClick={onConfigure}>
            {smtp.configured ? 'Edit' : 'Set up'}
          </Button>
        )}
      </div>
    </section>
  );
}
