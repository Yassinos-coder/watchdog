import type { IssueSort, IssueStatus } from '../types/issue.types';

export const STATUS_TABS: { value: IssueStatus | 'ALL'; label: string }[] = [
  { value: 'UNRESOLVED', label: 'Unresolved' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'IGNORED', label: 'Ignored' },
  { value: 'ALL', label: 'All' },
];

export const SORT_OPTIONS: { value: IssueSort; label: string }[] = [
  { value: 'lastSeen', label: 'Last seen' },
  { value: 'firstSeen', label: 'First seen' },
  { value: 'events', label: 'Most events' },
];

export const STATUS_LABEL: Record<IssueStatus, string> = {
  UNRESOLVED: 'Unresolved',
  RESOLVED: 'Resolved',
  IGNORED: 'Ignored',
};

export const DEFAULT_SORT: IssueSort = 'lastSeen';
