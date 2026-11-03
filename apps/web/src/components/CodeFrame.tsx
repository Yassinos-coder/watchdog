import { cn } from '@/lib/utils';

export interface CodeFrameLine {
  number: number;
  text: string;
  failing?: boolean;
}

interface CodeFrameProps {
  filename: string;
  functionName?: string;
  lines: CodeFrameLine[];
  className?: string;
}

export function CodeFrame({ filename, functionName, lines, className }: CodeFrameProps) {
  const failing = lines.find((line) => line.failing);
  const label = failing ? `Code around line ${failing.number} of ${filename}` : `Code from ${filename}`;

  return (
    <figure
      className={cn('overflow-hidden rounded-lg border bg-card text-card-foreground', className)}
      aria-label={label}
    >
      <figcaption className="flex items-baseline justify-between gap-4 border-b bg-muted/50 px-4 py-2">
        <span className="truncate font-mono text-xs font-medium" title={filename}>
          {filename}
        </span>
        {functionName && (
          <span className="shrink-0 truncate font-mono text-xs text-muted-foreground">{functionName}</span>
        )}
      </figcaption>
      <div className="scroll-x">
        <pre className="min-w-max py-2 font-mono text-[13px] leading-6">
          {lines.map((line) => (
            <div
              key={line.number}
              className={cn(
                'flex border-l-[3px] border-transparent pr-6',
                line.failing && 'border-lantern bg-lantern-soft',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'tabular w-12 shrink-0 select-none pr-4 text-right text-muted-foreground/70',
                  line.failing && 'font-semibold text-lantern',
                )}
              >
                {line.number}
              </span>
              <code className={cn('whitespace-pre', line.failing && 'font-medium')}>
                {line.text.length > 0 ? line.text : ' '}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </figure>
  );
}
