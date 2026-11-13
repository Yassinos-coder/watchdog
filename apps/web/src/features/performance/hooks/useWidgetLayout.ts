import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Layout } from 'react-grid-layout';
import { MIN_WIDGET_HEIGHT, MIN_WIDGET_WIDTH } from '../constants/performance.constants';
import type { Widget, WidgetLayoutItem } from '../types/performance.types';
import { useSaveLayout } from './usePerformanceMutations';

const toItems = (widgets: Widget[]): Layout =>
  widgets.map((widget) => ({
    i: widget.id,
    ...widget.layout,
    minW: MIN_WIDGET_WIDTH,
    minH: MIN_WIDGET_HEIGHT,
  }));

const signature = (widgets: Widget[]): string =>
  widgets.map((widget) => `${widget.id}:${widget.layout.x},${widget.layout.y},${widget.layout.w},${widget.layout.h}`).join('|');

export function useWidgetLayout(projectId: string, dashboardId: string, widgets: Widget[]) {
  const save = useSaveLayout(projectId);
  const [layout, setLayout] = useState<Layout>(() => toItems(widgets));
  const saved = signature(widgets);

  useEffect(() => {
    setLayout(toItems(widgets));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved, dashboardId]);

  const dirty = layout.some((item) => {
    const widget = widgets.find((entry) => entry.id === item.i);
    if (!widget) return false;
    const { x, y, w, h } = widget.layout;
    return item.x !== x || item.y !== y || item.w !== w || item.h !== h;
  });

  const reset = (): void => setLayout(toItems(widgets));

  const commit = (onSaved: () => void): void => {
    const items: WidgetLayoutItem[] = layout.map((item) => ({ id: item.i, x: item.x, y: item.y, w: item.w, h: item.h }));
    save.mutate(
      { dashboardId, items },
      {
        onSuccess: onSaved,
        onError: (error) => toast.error(`Could not save the layout: ${error.message}`),
      },
    );
  };

  return { layout, setLayout, dirty, reset, commit, saving: save.isPending };
}
