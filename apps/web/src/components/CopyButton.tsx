import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RESET_DELAY_MS = 1_800;

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = 'Copy', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), RESET_DELAY_MS);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copy}
      className={cn('shrink-0', className)}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <Check className="size-4 text-moss" /> : <Copy className="size-4" />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </Button>
  );
}
