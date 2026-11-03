import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CodeSnippet } from '@/components/CodeSnippet';
import { FieldRow } from '@/components/FieldRow';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_PLATFORM, PLATFORMS } from '../constants/platforms';
import { useCreateProject } from '../hooks/useProjectMutations';
import type { CreatedProject } from '../types/project.types';
import { SetupGuide } from './SetupGuide';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState(DEFAULT_PLATFORM);
  const [created, setCreated] = useState<CreatedProject | null>(null);

  const reset = (): void => {
    setName('');
    setPlatform(DEFAULT_PLATFORM);
    setCreated(null);
  };

  const handleOpenChange = (next: boolean): void => {
    onOpenChange(next);
    if (!next) {
      reset();
    }
  };

  const submit = (): void => {
    createProject.mutate(
      { name: name.trim(), platform },
      {
        onSuccess: setCreated,
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const openProject = (): void => {
    if (!created) return;
    onOpenChange(false);
    navigate(`/projects/${created.id}/issues`);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>{created.name} is ready</DialogTitle>
              <DialogDescription>
                Add the snippet below to your app. Watchdog will show the first error as soon as it arrives.
              </DialogDescription>
            </DialogHeader>
            <SetupGuide project={created} />
            <Alert>
              <AlertDescription className="grid min-w-0 gap-2">
                <span>
                  Your upload token is shown once. You need it to upload source maps from your build.
                </span>
                <CodeSnippet code={created.uploadToken} />
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button onClick={openProject}>Open project</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim()) submit();
            }}
            className="grid gap-5"
          >
            <DialogHeader>
              <DialogTitle>Create a project</DialogTitle>
              <DialogDescription>
                A project is one app or service you want to monitor. Each project gets its own key.
              </DialogDescription>
            </DialogHeader>
            <FieldRow label="Project name" htmlFor="project-name">
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Storefront"
                maxLength={80}
                autoFocus
              />
            </FieldRow>
            <FieldRow label="Platform" htmlFor="project-platform" hint="Picks the first setup snippet we show you.">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="project-platform" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <DialogFooter>
              <Button type="submit" disabled={!name.trim() || createProject.isPending}>
                {createProject.isPending && <Loader2 className="size-4 animate-spin" />}
                Create project
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
