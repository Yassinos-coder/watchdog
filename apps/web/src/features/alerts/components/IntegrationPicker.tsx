import { Server } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CHANNEL_META, CHANNEL_TYPES } from '../constants/alert.constants';
import type { ChannelType } from '../types/alert.types';

export type IntegrationChoice = ChannelType | 'SMTP';

interface IntegrationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (choice: IntegrationChoice) => void;
}

const BLURB: Record<IntegrationChoice, string> = {
  SLACK: 'Post alerts to a Slack channel.',
  DISCORD: 'Post alerts to a Discord channel.',
  TELEGRAM: 'Message a chat, group or channel through your own bot.',
  EMAIL: 'Email alerts to the addresses you choose.',
  SMTP: 'The mail server Watchdog sends email through, for email alerts and sign-in codes.',
};

export function IntegrationPicker({ open, onOpenChange, onChoose }: IntegrationPickerProps) {
  const options: { id: IntegrationChoice; label: string; icon: typeof Server }[] = [
    ...CHANNEL_TYPES.map((type) => ({ id: type, label: CHANNEL_META[type].label, icon: CHANNEL_META[type].icon })),
    { id: 'SMTP', label: 'SMTP', icon: Server },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New integration</DialogTitle>
          <DialogDescription>Choose what to connect to Watchdog.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChoose(id)}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-muted-foreground">{BLURB[id]}</span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
