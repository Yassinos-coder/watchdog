import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useIssueEvents } from '../hooks/useIssueQueries';
import { ISSUES_PAGE_SIZE } from '../services/issuesService';

interface EventsListProps {
  issueId: string;
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
}

export function EventsList({ issueId, selectedEventId, onSelect }: EventsListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useIssueEvents(issueId, page);

  if (isLoading || !data) {
    return <Skeleton className="h-40 w-full" />;
  }
  const pageCount = Math.max(Math.ceil(data.total / ISSUES_PAGE_SIZE), 1);

  return (
    <div className="grid gap-3">
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {data.items.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => onSelect(event.id)}
              aria-current={selectedEventId === event.id}
              className={cn(
                'flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-left text-sm hover:bg-accent',
                selectedEventId === event.id && 'bg-accent',
              )}
            >
              <span className="tabular">{Format.dateTime(event.timestamp)}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                {event.environment && <span>{event.environment}</span>}
                {event.release && <span className="max-w-40 truncate font-mono">{event.release}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="tabular text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4" /> Newer
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
              Older <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
