import { PageHeader } from '@/components/PageHeader';
import { Separator } from '@/components/ui/separator';
import { ChannelsSection } from '../components/ChannelsSection';
import { DeliveriesSection } from '../components/DeliveriesSection';
import { SmtpSection } from '../components/SmtpSection';

export function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect Slack, Discord, Telegram and email so Watchdog can reach you."
      />
      <div className="grid max-w-3xl grid-cols-1 gap-10 [&>*]:min-w-0">
        <ChannelsSection />
        <Separator />
        <SmtpSection />
        <Separator />
        <DeliveriesSection />
      </div>
    </>
  );
}
