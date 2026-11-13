import { Check, LayoutDashboard, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCanManage } from '@/features/alerts/hooks/useCanManage';
import { DashboardGrid } from '../components/DashboardGrid';
import { WidgetDialog } from '../components/WidgetDialog';
import { PERF_RANGES } from '../constants/performance.constants';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import {
  useCreateDashboard,
  useRemoveDashboard,
  useRemoveWidget,
} from '../hooks/usePerformanceMutations';
import { useDashboards } from '../hooks/usePerformanceQueries';
import type { PerfRange } from '../types/performance.types';

export function DashboardsPage() {
  const { projectId = '' } = useParams();
  const { data: dashboards, isLoading, error, refetch } = useDashboards(projectId);
  const canManage = useCanManage();
  const createDashboard = useCreateDashboard(projectId);
  const removeDashboard = useRemoveDashboard(projectId);
  const removeWidget = useRemoveWidget(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [range, setRange] = useState<PerfRange>('24h');
  const [name, setName] = useState('');
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const active = dashboards?.find((dashboard) => dashboard.id === activeId) ?? dashboards?.[0];
  const editor = useWidgetLayout(projectId, active?.id ?? '', active?.widgets ?? []);

  if (error) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  }

  const switchDashboard = (id: string | null): void => {
    setEditing(false);
    setActiveId(id);
  };

  const stopEditing = (): void => {
    editor.reset();
    setEditing(false);
  };

  const finishEditing = (): void => {
    if (!editor.dirty) {
      setEditing(false);
      return;
    }
    editor.commit(() => {
      setEditing(false);
      toast.success('Dashboard saved');
    });
  };

  const create = (): void => {
    createDashboard.mutate(name.trim(), {
      onSuccess: (dashboard) => {
        setName('');
        switchDashboard(dashboard.id);
      },
      onError: (failure) => toast.error(failure.message),
    });
  };

  return (
    <>
      <PageHeader
        title="Dashboards"
        description="Chart your own metrics and transaction timings side by side."
        actions={
          <Tabs value={range} onValueChange={(value) => setRange(value as PerfRange)}>
            <TabsList>
              {PERF_RANGES.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {isLoading && <Skeleton className="h-64 w-full" />}

      {dashboards && dashboards.length === 0 && (
        <EmptyState
          icon={LayoutDashboard}
          title="No dashboards yet"
          description={
            canManage
              ? 'Create one, then add widgets for the metrics you send with gauge(), increment() or distribution().'
              : 'Ask an admin to create a dashboard.'
          }
        />
      )}

      {canManage && (
        <form
          className="mb-6 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) create();
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="New dashboard name" maxLength={80} aria-label="New dashboard name" className="sm:max-w-xs" />
          <Button type="submit" variant="outline" disabled={!name.trim() || createDashboard.isPending}>
            {createDashboard.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create dashboard
          </Button>
        </form>
      )}

      {dashboards && dashboards.length > 0 && active && (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={active.id} onValueChange={switchDashboard} className="max-w-full min-w-0">
              <div className="max-w-full overflow-x-auto">
                <TabsList className="w-max">
                  {dashboards.map((dashboard) => (
                    <TabsTrigger key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
            {canManage && !editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                Edit dashboard
              </Button>
            )}
            {canManage && editing && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setWidgetOpen(true)}>
                  <Plus className="size-4" />
                  Add widget
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!window.confirm(`Delete the dashboard "${active.name}" and all its widgets?`)) return;
                    removeDashboard.mutate(active.id, {
                      onSuccess: () => switchDashboard(null),
                      onError: (failure) => toast.error(failure.message),
                    });
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete dashboard
                </Button>
                <Button size="sm" variant="ghost" onClick={stopEditing} disabled={editor.saving}>
                  <X className="size-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={finishEditing} disabled={editor.saving}>
                  {editor.saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Save dashboard
                </Button>
              </div>
            )}
          </div>

          {active.widgets.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              This dashboard is empty. Add a widget to start charting.
            </p>
          ) : (
            <DashboardGrid
              key={active.id}
              projectId={projectId}
              widgets={active.widgets}
              layout={editor.layout}
              range={range}
              editing={editing}
              onLayoutChange={editor.setLayout}
              onRemove={(target) => removeWidget.mutate(target.id, { onError: (failure) => toast.error(failure.message) })}
            />
          )}
          <WidgetDialog projectId={projectId} dashboardId={active.id} open={widgetOpen} onOpenChange={setWidgetOpen} />
        </div>
      )}
    </>
  );
}
