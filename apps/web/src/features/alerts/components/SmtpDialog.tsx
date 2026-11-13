import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SmtpForm } from './SmtpForm';

interface SmtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SmtpDialog({ open, onOpenChange }: SmtpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Email server (SMTP)</DialogTitle>
          <DialogDescription>The mail server Watchdog uses to send email alerts and sign-in codes.</DialogDescription>
        </DialogHeader>
        <SmtpForm />
      </DialogContent>
    </Dialog>
  );
}
