import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ErrorState';
import { FieldRow } from '@/components/FieldRow';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectKeysSection } from '../components/ProjectKeysSection';
import { SetupGuide } from '../components/SetupGuide';
import { SourceMapsSection } from '../components/SourceMapsSection';
import { PLATFORMS } from '../constants/platforms';
import { useDeleteProject, useUpdateProject } from '../hooks/useProjectMutations';
import { useProject } from '../hooks/useProjectQueries';

export function ProjectSettingsPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, error, refetch } = useProject(projectId);
  const update = useUpdateProject(projectId);
  const remove = useDeleteProject();
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [confirmName, setConfirmName] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setPlatform(project.platform);
    }
  }, [project]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (error || !project) {
    return <ErrorState message={error?.message ?? 'Project not found'} onRetry={() => void refetch()} />;
  }

  const dirty = name.trim() !== project.name || platform !== project.platform;

  return (
    <>
      <PageHeader title="Project settings" description={project.name} />

      <div className="grid max-w-3xl grid-cols-1 gap-10 [&>*]:min-w-0">
        <form
          className="grid grid-cols-1 gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            update.mutate(
              { name: name.trim(), platform },
              {
                onSuccess: () => toast.success('Project updated'),
                onError: (failure) => toast.error(failure.message),
              },
            );
          }}
        >
          <h2 className="text-lg font-semibold">General</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Project name" htmlFor="name">
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
            </FieldRow>
            <FieldRow label="Platform" htmlFor="platform">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform" className="w-full">
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
          </div>
          <div>
            <Button type="submit" disabled={!dirty || !name.trim() || update.isPending}>
              {update.isPending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>

        <Separator />
        <ProjectKeysSection project={project} />
        <Separator />
        <section aria-labelledby="guide-heading" className="grid grid-cols-1 gap-4">
          <h2 id="guide-heading" className="text-lg font-semibold">
            Setup guide
          </h2>
          <SetupGuide project={project} />
        </section>
        <Separator />
        <SourceMapsSection project={project} />
        <Separator />

        <section aria-labelledby="danger-heading" className="grid grid-cols-1 gap-3 rounded-xl border border-destructive/40 p-4">
          <h2 id="danger-heading" className="text-lg font-semibold text-destructive">
            Delete project
          </h2>
          <p className="text-sm text-muted-foreground">
            This permanently deletes the project, its issues, events and source maps. Type{' '}
            <strong className="text-foreground">{project.name}</strong> to confirm.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              aria-label="Type the project name to confirm"
              className="sm:max-w-xs"
            />
            <Button
              variant="destructive"
              disabled={confirmName !== project.name || remove.isPending}
              onClick={() =>
                remove.mutate(project.id, {
                  onSuccess: () => {
                    toast.success('Project deleted');
                    navigate('/projects', { replace: true });
                  },
                  onError: (failure) => toast.error(failure.message),
                })
              }
            >
              {remove.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete project
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
