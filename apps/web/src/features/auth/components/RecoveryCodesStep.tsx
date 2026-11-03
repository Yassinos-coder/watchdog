import { Download } from 'lucide-react';
import { useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface RecoveryCodesStepProps {
  codes: string[];
  onDone: () => void;
  doneLabel?: string;
}

export function RecoveryCodesStep({ codes, onDone, doneLabel = 'Continue' }: RecoveryCodesStepProps) {
  const [saved, setSaved] = useState(false);

  const download = (): void => {
    const blob = new Blob([`Watchdog recovery codes\n\n${codes.join('\n')}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'watchdog-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted-foreground">
        If you lose your phone or passkey, these codes get you back in. Each one works once. Store them
        somewhere safe, like a password manager. We cannot show them again.
      </p>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border bg-muted/40 p-4 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="tabular">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <CopyButton value={codes.join('\n')} label="Copy codes" />
        <Button type="button" variant="outline" size="sm" onClick={download}>
          <Download className="size-4" /> Download
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="saved-codes" checked={saved} onCheckedChange={(value) => setSaved(value === true)} />
        <Label htmlFor="saved-codes" className="font-normal">
          I have saved these codes
        </Label>
      </div>
      <Button size="lg" onClick={onDone} disabled={!saved}>
        {doneLabel}
      </Button>
    </div>
  );
}
