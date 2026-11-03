import { Link } from 'react-router-dom';
import { Format } from '@/lib/format';
import type { Issue } from '../types/issue.types';
import { LevelDot, StatusBadge } from './IssueBadges';

interface IssueRowProps {
  issue: Issue;
}

export function IssueRow({ issue }: IssueRowProps) {
  const release = issue.lastRelease ?? issue.firstRelease;

  return (
    <li>
      <Link
        to={`/projects/${issue.projectId}/issues/${issue.id}`}
        className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-1 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent sm:px-5"
      >
        <LevelDot level={issue.level} className="mt-[7px]" />
        <div className="min-w-0">
          <p className="truncate font-medium leading-6">{issue.title}</p>
          {issue.culprit && (
            <p className="truncate font-mono text-xs text-muted-foreground">{issue.culprit}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:hidden">
            <StatusBadge status={issue.status} regressed={Boolean(issue.regressedAt)} />
            <span>{Format.relativeTime(issue.lastSeen)}</span>
            {release && <span className="max-w-32 truncate font-mono">{release}</span>}
          </div>
        </div>
        <div className="flex items-center gap-5 text-right">
          <div className="hidden sm:block">
            <StatusBadge status={issue.status} regressed={Boolean(issue.regressedAt)} />
          </div>
          <div className="hidden w-24 text-xs text-muted-foreground sm:block">
            <p>{Format.relativeTime(issue.lastSeen)}</p>
            {release && <p className="truncate font-mono">{release}</p>}
          </div>
          <div className="tabular min-w-12 text-sm font-medium">
            {Format.number(issue.eventCount)}
            <span className="block text-xs font-normal text-muted-foreground">
              {issue.eventCount === 1 ? 'event' : 'events'}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
