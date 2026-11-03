import { CopyButton } from '@/components/CopyButton';
import { cn } from '@/lib/utils';

interface CodeSnippetProps {
  code: string;
  label?: string;
  className?: string;
}

export function CodeSnippet({ code, label = 'Copy', className }: CodeSnippetProps) {
  return (
    <div className={cn('min-w-0 max-w-full overflow-hidden rounded-lg border bg-muted/40', className)}>
      <div className="flex items-start gap-2">
        <pre className="scroll-x min-w-0 flex-1 p-3 font-mono text-[13px] leading-6">
          <code>{code}</code>
        </pre>
        <CopyButton value={code} label={label} className="m-2" />
      </div>
    </div>
  );
}
