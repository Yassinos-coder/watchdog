import { Trash2, Video } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReplayPlayer } from '../components/ReplayPlayer';
import { ReplayRow } from '../components/ReplayRow';
import { useDeleteReplay } from '../hooks/useReplayMutations';
import { useReplayEvents, useReplays } from '../hooks/useReplayQueries';

export function ReplaysPage() {
  const { projectId = '', replayId } = useParams();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(replayId ?? null);
  const { data, isLoading, error, refetch } = useReplays(projectId, page);
  const { data: playback, isLoading: loadingPlayback } = useReplayEvents(selected);
  const remove = useDeleteReplay(projectId);

  if (error) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader title="Replays" description="Watch what users did before things went wrong." />

      {isLoading && <Skeleton className="h-64 w-full" />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={Video}
          title="No replays yet"
          description="Enable the replay option in the browser SDK to start recording sessions."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="overflow-hidden rounded-lg border">
            {data.items.map((replay) => (
              <ReplayRow
                key={replay.id}
                replay={replay}
                active={replay.id === selected}
                onSelect={() => setSelected(replay.id)}
              />
            ))}
            <div className="flex items-center justify-between p-2 text-xs text-muted-foreground">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span>
                {page} / {totalPages}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            {!selected && <p className="text-sm text-muted-foreground">Pick a replay to watch it.</p>}
            {selected && loadingPlayback && <Skeleton className="h-80 w-full" />}
            {selected && playback && (
              <>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(selected, { onSuccess: () => setSelected(null) })}
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>
                <ReplayPlayer events={playback.events} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
