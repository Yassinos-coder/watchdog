import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { CodeFrame } from '@/components/CodeFrame';
import { cn } from '@/lib/utils';
import type { StackFrame } from '../types/issue.types';
import { FrameUtils } from '../utils/frame.utils';

interface StackTraceProps {
  frames: StackFrame[];
}

export function StackTrace({ frames }: StackTraceProps) {
  const [showLibraries, setShowLibraries] = useState(false);
  const newest = FrameUtils.newestFirst(frames);
  const visible = showLibraries ? newest : newest.filter((frame) => frame.inApp !== false);
  const hidden = newest.length - newest.filter((frame) => frame.inApp !== false).length;

  if (frames.length === 0) {
    return <p className="text-sm text-muted-foreground">This event has no stack trace.</p>;
  }

  return (
    <div className="grid gap-2">
      <ol className="grid gap-2">
        {visible.map((frame, index) => (
          <FrameItem key={`${FrameUtils.location(frame)}-${index}`} frame={frame} />
        ))}
      </ol>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowLibraries((current) => !current)}
          className="justify-self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {showLibraries ? 'Hide' : 'Show'} {hidden} library {hidden === 1 ? 'frame' : 'frames'}
        </button>
      )}
    </div>
  );
}

function FrameItem({ frame }: { frame: StackFrame }) {
  const lines = FrameUtils.toCodeLines(frame);
  const expandable = lines.length > 0;
  const [open, setOpen] = useState(false);

  return (
    <li className={cn('overflow-hidden rounded-lg border', frame.inApp === false && 'bg-muted/30')}>
      <button
        type="button"
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left enabled:hover:bg-accent disabled:cursor-default"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[13px] font-medium">
            {FrameUtils.displayName(frame)}
          </span>
          <span className="block truncate font-mono text-xs text-muted-foreground" title={FrameUtils.location(frame)}>
            {FrameUtils.location(frame)}
          </span>
        </span>
        {frame.symbolicated && (
          <span className="hidden shrink-0 rounded-full bg-moss-soft px-2 py-0.5 text-xs font-medium text-moss sm:inline">
            Source mapped
          </span>
        )}
        {expandable && (
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
        )}
      </button>
      {open && expandable && (
        <CodeFrame
          filename={frame.filename ?? ''}
          functionName={frame.function}
          lines={lines}
          className="rounded-none border-0 border-t"
        />
      )}
    </li>
  );
}
