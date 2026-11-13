import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Separator } from '@/components/ui/separator';
import { ChannelDialog } from '../components/ChannelDialog';
import { ChannelsSection } from '../components/ChannelsSection';
import { DeliveriesSection } from '../components/DeliveriesSection';
import { IntegrationPicker, type IntegrationChoice } from '../components/IntegrationPicker';
import { SmtpDialog } from '../components/SmtpDialog';
import { SmtpSummary } from '../components/SmtpSummary';
import type { ChannelType } from '../types/alert.types';

export function IntegrationsPage() {
  const [picking, setPicking] = useState(false);
  const [channelType, setChannelType] = useState<ChannelType | null>(null);
  const [smtpOpen, setSmtpOpen] = useState(false);

  const choose = (choice: IntegrationChoice): void => {
    setPicking(false);
    if (choice === 'SMTP') {
      setSmtpOpen(true);
      return;
    }
    setChannelType(choice);
  };

  return (
    <>
      <PageHeader
        title="Channels"
        description="Connect Slack, Discord, Telegram and email so Watchdog can reach you."
      />
      <div className="grid max-w-3xl grid-cols-1 gap-10 [&>*]:min-w-0">
        <ChannelsSection onAdd={() => setPicking(true)} />
        <Separator />
        <SmtpSummary onConfigure={() => setSmtpOpen(true)} />
        <Separator />
        <DeliveriesSection />
      </div>
      <IntegrationPicker open={picking} onOpenChange={setPicking} onChoose={choose} />
      <ChannelDialog
        open={channelType !== null}
        initialType={channelType ?? 'SLACK'}
        onOpenChange={(open) => !open && setChannelType(null)}
      />
      <SmtpDialog open={smtpOpen} onOpenChange={setSmtpOpen} />
    </>
  );
}
