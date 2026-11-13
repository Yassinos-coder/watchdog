import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDeleteProject } from '@/features/projects/hooks/useProjectMutations';
import type { Project } from '@/features/projects/types/project.types';

interface DeleteProjectDialogProps {
  project: Project | null;
  onClose: () => void;
}

export function DeleteProjectDialog({ project, onClose }: DeleteProjectDialogProps) {
  const remove = useDeleteProject();
  const [confirmName, setConfirmName] = useState('');

  const close = (): void => {
    setConfirmName('');
    onClose();
  };

  return (
    <Dialog open={project !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!project) return;
            remove.mutate(project.id, {
              onSuccess: () => {
                toast.success('Project deleted');
                close();
              },
              onError: (failure) => toast.error(failure.message),
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete {project?.name}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the project with its issues, events, performance data, replays,
              dashboards, alert rules and source maps. Type <span className="font-mono font-medium">{project?.name}</span> to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            aria-label="Type the project name to confirm"
            autoComplete="off"
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={confirmName !== project?.name || remove.isPending}>
              {remove.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
