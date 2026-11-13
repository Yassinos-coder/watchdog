import { useSeries } from '../hooks/usePerformanceQueries';
import {
  CUSTOM_TEMPLATES,
  READY_TEMPLATES,
  type WidgetTemplate,
} from '../constants/widgetTemplates.constants';
import { PerformanceUtils } from '../utils/performance.utils';
import { WidgetTemplateCard } from './WidgetTemplateCard';

interface WidgetGalleryProps {
  projectId: string;
  open: boolean;
  onSelect: (template: WidgetTemplate) => void;
}

interface LiveTemplateCardProps {
  projectId: string;
  template: WidgetTemplate;
  open: boolean;
  onSelect: (template: WidgetTemplate) => void;
}

function LiveTemplateCard({ projectId, template, open, onSelect }: LiveTemplateCardProps) {
  const { data } = useSeries(
    projectId,
    { source: template.source, aggregation: template.aggregation, range: '24h' },
    open,
  );
  const values = data?.points.flatMap((point) => (point.value === null ? [] : [point.value])) ?? [];
  const hasData = values.length >= 2;
  const total = data
    ? PerformanceUtils.value(data.total, template.unit === 'duration', template.aggregation)
    : null;

  return (
    <WidgetTemplateCard
      template={template}
      liveValues={hasData ? values : null}
      liveTotal={hasData ? total : null}
      onSelect={onSelect}
    />
  );
}

export function WidgetGallery({ projectId, open, onSelect }: WidgetGalleryProps) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">Ready to use</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {READY_TEMPLATES.map((template) => (
            <LiveTemplateCard
              key={template.id}
              projectId={projectId}
              template={template}
              open={open}
              onSelect={onSelect}
            />
          ))}
        </div>
      </section>
      <section className="grid gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">Build from your own metrics</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {CUSTOM_TEMPLATES.map((template) => (
            <WidgetTemplateCard
              key={template.id}
              template={template}
              liveValues={null}
              liveTotal={null}
              onSelect={onSelect}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
