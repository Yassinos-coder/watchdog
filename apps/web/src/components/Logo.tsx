import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-foreground" />
        <path
          d="M8 20c0-5 3-9 8-9s8 4 8 9"
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          className="stroke-background"
        />
        <circle cx="16" cy="19" r="3.2" className="fill-lantern" />
      </svg>
      {showWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight">Watchdog</span>
      )}
    </span>
  );
}
