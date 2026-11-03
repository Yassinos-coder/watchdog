import { Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Format } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Replay } from '../types/replay.types';
import { ReplayUtils } from '../utils/replay.utils';

interface ReplayRowProps {
  replay: Replay;
  active: boolean;
  onSelect: () => void;
}

export function ReplayRow({ replay, active, onSelect }: ReplayRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50',
        active && 'bg-muted',
      )}
    >
      <span className="truncate text-sm font-medium">{ReplayUtils.path(replay.url)}</span>
      <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{Format.relativeTime(replay.startedAt)}</span>
        <span>{ReplayUtils.duration(replay.durationMs)}</span>
        {replay.userId && <span className="truncate">{replay.userId}</span>}
        {replay.errorEventIds.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <Bug className="size-3" />
            {replay.errorEventIds.length}
          </Badge>
        )}
      </span>
    </button>
  );
}
