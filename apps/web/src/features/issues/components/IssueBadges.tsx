import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { STATUS_LABEL } from '../constants/issue.constants';
import type { IssueStatus } from '../types/issue.types';

const LEVEL_STYLE: Record<string, string> = {
  fatal: 'bg-signal',
  error: 'bg-signal',
  warning: 'bg-lantern',
  info: 'bg-chart-1',
  debug: 'bg-muted-foreground',
};

export function LevelDot({ level, className }: { level: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${level} level`}
      title={level}
      className={cn('inline-block size-2.5 shrink-0 rounded-full', LEVEL_STYLE[level] ?? 'bg-muted-foreground', className)}
    />
  );
}

const STATUS_STYLE: Record<IssueStatus, string> = {
  UNRESOLVED: 'border-signal/40 bg-signal-soft text-signal',
  RESOLVED: 'border-moss/40 bg-moss-soft text-moss',
  IGNORED: 'border-border bg-muted text-muted-foreground',
};

export function StatusBadge({ status, regressed }: { status: IssueStatus; regressed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="outline" className={cn('font-medium', STATUS_STYLE[status])}>
        {STATUS_LABEL[status]}
      </Badge>
      {regressed && status === 'UNRESOLVED' && (
        <Badge variant="outline" className="border-lantern/50 bg-lantern-soft font-medium text-lantern">
          Regressed
        </Badge>
      )}
    </span>
  );
}
