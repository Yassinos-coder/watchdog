import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '../hooks/useProjectQueries';

export function HomeRedirect() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }
  if (projects?.length === 1) {
    return <Navigate to={`/projects/${projects[0].id}`} replace />;
  }
  return <Navigate to="/projects" replace />;
}
