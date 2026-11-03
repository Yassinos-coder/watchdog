import { ChevronRight, FolderPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Format } from '@/lib/format';
import { CreateProjectDialog } from '../components/CreateProjectDialog';
import { PLATFORMS } from '../constants/platforms';
import { useProjects } from '../hooks/useProjectQueries';

export function ProjectsPage() {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every app or service that reports errors to this Watchdog."
        actions={
          projects && projects.length > 0 ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New project
            </Button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="grid gap-px overflow-hidden rounded-xl border">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-[72px] rounded-none" />
          ))}
        </div>
      )}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {projects && projects.length === 0 && (
        <EmptyState
          icon={FolderPlus}
          title="Create your first project"
          description="A project gives you a key to put in your app. Errors show up here within seconds."
          action={<Button onClick={() => setCreating(true)}>Create project</Button>}
        />
      )}
      {projects && projects.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-accent focus-visible:bg-accent sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{project.name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {PLATFORMS.find((platform) => platform.value === project.platform)?.label ?? project.platform}
                    {' · '}Created {Format.shortDate(project.createdAt)}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <CreateProjectDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}
