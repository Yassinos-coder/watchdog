import { Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCanManage } from '@/features/alerts/hooks/useCanManage';
import { PLATFORMS } from '@/features/projects/constants/platforms';
import { useProjects } from '@/features/projects/hooks/useProjectQueries';
import type { Project } from '@/features/projects/types/project.types';
import { Format } from '@/lib/format';
import { DeleteProjectDialog } from '../components/DeleteProjectDialog';

export function AccountProjectsPage() {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const canManage = useCanManage();
  const [deleting, setDeleting] = useState<Project | null>(null);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every app that reports to this Watchdog. Open a project's settings for its keys and source maps."
      />
      {isLoading && <Skeleton className="h-40 w-full" />}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {projects && projects.length === 0 && (
        <EmptyState icon={Settings2} title="No projects yet" description="Create one from the Projects page." />
      )}
      {projects && projects.length > 0 && (
        <ul className="grid divide-y overflow-hidden rounded-xl border bg-card">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{project.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {PLATFORMS.find((platform) => platform.value === project.platform)?.label ?? project.platform} · created{' '}
                  {Format.shortDate(project.createdAt)} · {project.keys.length} {project.keys.length === 1 ? 'key' : 'keys'}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/projects/${project.id}/settings`}>Settings</Link>
              </Button>
              {canManage && (
                <Button variant="ghost" size="icon" aria-label={`Delete ${project.name}`} onClick={() => setDeleting(project)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <DeleteProjectDialog project={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
