import { ChevronLeft, ChevronRight, CircleCheck, Inbox, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssueRow } from '../components/IssueRow';
import { DEFAULT_SORT, SORT_OPTIONS, STATUS_TABS } from '../constants/issue.constants';
import { useIssues } from '../hooks/useIssueQueries';
import { ISSUES_PAGE_SIZE } from '../services/issuesService';
import type { IssueListParams, IssueSort, IssueStatus } from '../types/issue.types';

const SEARCH_DEBOUNCE_MS = 300;

export function IssuesPage() {
  const { projectId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = (searchParams.get('status') ?? 'UNRESOLVED') as IssueStatus | 'ALL';
  const sort = (searchParams.get('sort') ?? DEFAULT_SORT) as IssueSort;
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const urlQuery = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(urlQuery);

  const params: IssueListParams = {
    status: statusParam === 'ALL' ? undefined : statusParam,
    q: urlQuery || undefined,
    sort,
    page,
  };
  const { data, isLoading, isFetching, error, refetch } = useIssues(projectId, params);

  const update = (changes: Record<string, string | null>): void => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (search === urlQuery) return;
    const timer = window.setTimeout(() => update({ q: search.trim(), page: null }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const pageCount = data ? Math.max(Math.ceil(data.total / ISSUES_PAGE_SIZE), 1) : 1;
  const filtered = Boolean(urlQuery) || statusParam !== 'UNRESOLVED';

  return (
    <>
      <PageHeader title="Issues" description="Errors grouped by cause, newest activity first." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={statusParam} onValueChange={(value) => update({ status: value, page: null })}>
          <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden sm:w-fit">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or file"
              className="pl-9"
              aria-label="Search issues"
            />
          </div>
          <Select value={sort} onValueChange={(value) => update({ sort: value, page: null })}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Sort issues">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-px overflow-hidden rounded-xl border">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-[76px] rounded-none" />
          ))}
        </div>
      )}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={filtered ? Inbox : CircleCheck}
          title={filtered ? 'No issues match' : 'No unresolved issues'}
          description={
            filtered
              ? 'Try a different status or search term.'
              : 'Nothing is broken right now. New errors from your apps will appear here.'
          }
          action={
            filtered ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setSearchParams({}, { replace: true });
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <ul
            className="divide-y overflow-hidden rounded-xl border bg-card transition-opacity data-[stale=true]:opacity-60"
            data-stale={isFetching}
          >
            {data.items.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </ul>
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
            <span className="tabular text-muted-foreground">
              {data.total} {data.total === 1 ? 'issue' : 'issues'} · Page {page} of {pageCount}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => update({ page: String(page + 1) })}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
