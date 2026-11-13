import { CodeSnippet } from '@/components/CodeSnippet';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SecretDialogProps {
  secret: string | null;
  onClose: () => void;
}

const VERIFY = `// Node.js: verify a delivery
import { createHmac, timingSafeEqual } from 'node:crypto';

function isFromWatchdog(secret, header, rawBody) {
  const parts = Object.fromEntries(header.split(',').map((part) => part.split('=')));
  const expected = createHmac('sha256', secret).update(\`\${parts.t}.\${rawBody}\`).digest('hex');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
// header = the x-watchdog-signature request header
// rawBody = the request body exactly as received`;

export function SecretDialog({ secret, onClose }: SecretDialogProps) {
  return (
    <Dialog open={secret !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your signing secret</DialogTitle>
          <DialogDescription>
            Copy it now and keep it on your server. It is shown only once. Watchdog signs every delivery with it so you
            can check a request really came from you.
          </DialogDescription>
        </DialogHeader>
        {secret && <CodeSnippet code={secret} />}
        <p className="text-sm font-medium">Checking a delivery</p>
        <CodeSnippet code={VERIFY} />
        <DialogFooter>
          <Button onClick={onClose}>I have copied it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
