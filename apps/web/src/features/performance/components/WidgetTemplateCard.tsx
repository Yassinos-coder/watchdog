import { Badge } from '@/components/ui/badge';
import { MOCK_TABLE_ROWS, type WidgetTemplate } from '../constants/widgetTemplates.constants';
import { PerformanceUtils } from '../utils/performance.utils';
import { MiniChart } from './MiniChart';

interface WidgetTemplateCardProps {
  template: WidgetTemplate;
  liveValues: number[] | null;
  liveTotal: string | null;
  onSelect: (template: WidgetTemplate) => void;
}

export function WidgetTemplateCard({
  template,
  liveValues,
  liveTotal,
  onSelect,
}: WidgetTemplateCardProps) {
  const isLive = liveValues !== null;
  const values = liveValues ?? PerformanceUtils.mockSeries(template.mock);

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="group flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-20 items-center">
        {template.display === 'NUMBER' && (
          <p
            className={`font-display text-4xl font-semibold tabular ${isLive ? '' : 'text-muted-foreground'}`}
          >
            {isLive ? (liveTotal ?? '—') : template.mockNumber}
          </p>
        )}
        {template.display === 'TABLE' && (
          <ul className="w-full divide-y text-xs text-muted-foreground opacity-70">
            {MOCK_TABLE_ROWS.map((row) => (
              <li key={row.key} className="flex justify-between py-1">
                <span className="font-mono">{row.key}</span>
                <span className="tabular">{row.value}</span>
              </li>
            ))}
          </ul>
        )}
        {(template.display === 'LINE' || template.display === 'BAR') && (
          <MiniChart values={values} kind={template.display} muted={!isLive} />
        )}
      </div>
      <div className="min-w-0">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h4 className="truncate font-semibold">{template.title}</h4>
          {template.live && (
            <Badge variant={isLive ? 'default' : 'outline'}>
              {isLive ? 'Your data' : 'Example'}
            </Badge>
          )}
          {!template.live && <Badge variant="outline">Example</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </div>
    </button>
  );
}
