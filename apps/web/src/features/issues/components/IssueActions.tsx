import { CheckCheck, EyeOff, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteIssue, useUpdateIssueStatus } from '../hooks/useIssueMutations';
import type { Issue, IssueStatus } from '../types/issue.types';

interface IssueActionsProps {
  issue: Issue;
}

const PAST_TENSE: Record<IssueStatus, string> = {
  UNRESOLVED: 'Reopened',
  RESOLVED: 'Resolved',
  IGNORED: 'Ignored',
};

export function IssueActions({ issue }: IssueActionsProps) {
  const navigate = useNavigate();
  const updateStatus = useUpdateIssueStatus(issue.id, issue.projectId);
  const remove = useDeleteIssue(issue.id, issue.projectId);

  const change = (status: IssueStatus): void => {
    updateStatus.mutate(status, {
      onSuccess: () => toast.success(PAST_TENSE[status]),
      onError: (error) => toast.error(error.message),
    });
  };

  const deleteIssue = (): void => {
    if (!window.confirm('Delete this issue and all of its events?')) return;
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('Issue deleted');
        navigate(`/projects/${issue.projectId}/issues`, { replace: true });
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <>
      {issue.status === 'UNRESOLVED' ? (
        <Button onClick={() => change('RESOLVED')} disabled={updateStatus.isPending}>
          <CheckCheck className="size-4" /> Resolve
        </Button>
      ) : (
        <Button variant="outline" onClick={() => change('UNRESOLVED')} disabled={updateStatus.isPending}>
          <RotateCcw className="size-4" /> Reopen
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {issue.status !== 'IGNORED' && (
            <DropdownMenuItem onClick={() => change('IGNORED')}>
              <EyeOff className="size-4" /> Ignore
            </DropdownMenuItem>
          )}
          {issue.status === 'UNRESOLVED' && <DropdownMenuSeparator />}
          <DropdownMenuItem variant="destructive" onClick={deleteIssue}>
            <Trash2 className="size-4" /> Delete issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
