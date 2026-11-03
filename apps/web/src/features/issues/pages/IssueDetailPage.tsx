import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CodeFrame } from '@/components/CodeFrame';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Format } from '@/lib/format';
import { BreadcrumbList } from '../components/BreadcrumbList';
import { EventDetails } from '../components/EventDetails';
import { EventsList } from '../components/EventsList';
import { LevelDot, StatusBadge } from '../components/IssueBadges';
import { IssueActions } from '../components/IssueActions';
import { StackTrace } from '../components/StackTrace';
import { useEvent, useIssue } from '../hooks/useIssueQueries';
import { FrameUtils } from '../utils/frame.utils';

export function IssueDetailPage() {
  const { projectId = '', issueId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEventId = searchParams.get('event');
  const { data: detail, isLoading, error, refetch } = useIssue(issueId);
  const { data: selectedEvent } = useEvent(selectedEventId);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (error || !detail) {
    return <ErrorState message={error?.message ?? 'Issue not found'} onRetry={() => void refetch()} />;
  }

  const { issue } = detail;
  const event = selectedEventId && selectedEvent ? selectedEvent : detail.latestEvent;
  const exception = event?.payload.exception;
  const headline = exception ? FrameUtils.headline(exception.frames) : undefined;
  const headlineLines = headline ? FrameUtils.toCodeLines(headline) : [];
  const breadcrumbs = event?.payload.breadcrumbs ?? [];

  return (
    <>
      <Link
        to={`/projects/${projectId}/issues`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Issues
      </Link>

      <header className="mb-6 grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <LevelDot level={issue.level} />
              <StatusBadge status={issue.status} regressed={Boolean(issue.regressedAt)} />
            </div>
            <h1 className="break-words text-xl font-semibold leading-snug sm:text-2xl">{issue.title}</h1>
            {issue.culprit && (
              <p className="mt-1 break-all font-mono text-sm text-muted-foreground">{issue.culprit}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <IssueActions issue={issue} />
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Meta label="Events" value={Format.number(issue.eventCount)} />
          <Meta label="First seen" value={Format.relativeTime(issue.firstSeen)} title={Format.dateTime(issue.firstSeen)} />
          <Meta label="Last seen" value={Format.relativeTime(issue.lastSeen)} title={Format.dateTime(issue.lastSeen)} />
          {issue.lastRelease && <Meta label="Release" value={issue.lastRelease} mono />}
        </dl>
      </header>

      {selectedEventId && event && (
        <p className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-lantern/40 bg-lantern-soft px-4 py-2.5 text-sm">
          Showing the event from {Format.dateTime(event.timestamp)}.
          <button
            type="button"
            className="font-medium underline underline-offset-4"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('event');
              setSearchParams(next, { replace: true });
            }}
          >
            Back to the latest event
          </button>
        </p>
      )}

      {headline && headlineLines.length > 0 && (
        <section aria-label="Where it failed" className="mb-8">
          <CodeFrame
            filename={`${headline.filename ?? ''}${headline.lineno ? `:${headline.lineno}` : ''}`}
            functionName={headline.function}
            lines={headlineLines}
          />
        </section>
      )}
      {headline && headlineLines.length === 0 && (
        <section aria-label="Where it failed" className="mb-8 rounded-lg border border-dashed p-4 text-sm">
          <p className="break-all font-mono">{FrameUtils.location(headline)}</p>
          <p className="mt-1 text-muted-foreground">
            No source code is available for this frame. Upload source maps for release{' '}
            <span className="font-mono">{event?.release ?? 'your release'}</span> to see the code around it.
          </p>
        </section>
      )}

      <Tabs defaultValue="stack">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto overflow-y-hidden sm:w-fit">
          <TabsTrigger value="stack">Stack trace</TabsTrigger>
          <TabsTrigger value="breadcrumbs">Breadcrumbs ({breadcrumbs.length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="events">Events ({issue.eventCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="stack">
          {exception ? (
            <>
              <p className="mb-3 break-words text-sm">
                <span className="font-semibold">{exception.type}</span>
                {exception.value && <span className="text-muted-foreground">: {exception.value}</span>}
                {!exception.handled && (
                  <span className="ml-2 rounded-full bg-signal-soft px-2 py-0.5 text-xs font-medium text-signal">
                    Unhandled
                  </span>
                )}
              </p>
              <StackTrace frames={exception.frames} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This was reported as a message, so there is no stack trace.
            </p>
          )}
        </TabsContent>
        <TabsContent value="breadcrumbs">
          <BreadcrumbList breadcrumbs={breadcrumbs} eventTime={event?.timestamp ?? issue.lastSeen} />
        </TabsContent>
        <TabsContent value="details">{event && <EventDetails event={event} />}</TabsContent>
        <TabsContent value="events">
          <EventsList
            issueId={issue.id}
            selectedEventId={event?.id ?? null}
            onSelect={(eventId) => {
              const next = new URLSearchParams(searchParams);
              next.set('event', eventId);
              setSearchParams(next, { replace: true });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Meta({ label, value, title, mono }: { label: string; value: string; title?: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'max-w-48 truncate font-mono text-xs leading-6' : 'tabular font-medium'} title={title ?? value}>
        {value}
      </dd>
    </div>
  );
}
