import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FieldRow } from '@/components/FieldRow';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AGGREGATION_OPTIONS,
  DISPLAY_OPTIONS,
  ERROR_AGGREGATION_OPTIONS,
} from '../constants/performance.constants';
import type { WidgetTemplate } from '../constants/widgetTemplates.constants';
import { useAddWidget } from '../hooks/usePerformanceMutations';
import { useMetricNames, useTagKeys, useTransactionSummary } from '../hooks/usePerformanceQueries';
import type { Aggregation, SeriesSource, WidgetDisplay } from '../types/performance.types';
import { WidgetGallery } from './WidgetGallery';

interface WidgetDialogProps {
  projectId: string;
  dashboardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_TRANSACTIONS = '__all__';
const NONE = '__none__';

export function WidgetDialog({ projectId, dashboardId, open, onOpenChange }: WidgetDialogProps) {
  const addWidget = useAddWidget(projectId);
  const { data: metrics } = useMetricNames(projectId);
  const { data: transactions } = useTransactionSummary(projectId, '30d');
  const [step, setStep] = useState<'gallery' | 'configure'>('gallery');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<SeriesSource>('METRIC');
  const [metricName, setMetricName] = useState('');
  const [filterName, setFilterName] = useState(ALL_TRANSACTIONS);
  const [aggregation, setAggregation] = useState<Aggregation>('AVG');
  const [display, setDisplay] = useState<WidgetDisplay>('LINE');
  const [groupBy, setGroupBy] = useState(NONE);
  const [tagKey, setTagKey] = useState(NONE);
  const [tagValue, setTagValue] = useState('');
  const taggable = source !== 'ERRORS';
  const subject =
    source === 'METRIC' ? metricName : filterName === ALL_TRANSACTIONS ? undefined : filterName;
  const { data: tagKeys } = useTagKeys(
    projectId,
    source,
    subject || undefined,
    open &&
      step === 'configure' &&
      taggable &&
      (source === 'TRANSACTIONS' || metricName.length > 0),
  );
  const filterValues = tagKeys?.find((entry) => entry.key === tagKey)?.values ?? [];
  const aggregationOptions = source === 'ERRORS' ? ERROR_AGGREGATION_OPTIONS : AGGREGATION_OPTIONS;

  const valid =
    title.trim().length > 0 &&
    (source !== 'METRIC' || metricName.length > 0) &&
    (tagKey === NONE || tagValue.trim().length > 0);

  const resetTags = (): void => {
    setGroupBy(NONE);
    setTagKey(NONE);
    setTagValue('');
  };

  const choose = (template: WidgetTemplate): void => {
    setTitle(template.needsSetup ? '' : template.title);
    setSource(template.source);
    setAggregation(template.aggregation);
    setDisplay(template.display);
    setMetricName('');
    setFilterName(ALL_TRANSACTIONS);
    resetTags();
    setStep('configure');
  };

  const close = (nextOpen: boolean): void => {
    onOpenChange(nextOpen);
    if (!nextOpen) setStep('gallery');
  };

  const changeSource = (value: SeriesSource): void => {
    setSource(value);
    resetTags();
    if (value === 'ERRORS') setAggregation('COUNT');
  };

  const submit = (): void => {
    addWidget.mutate(
      {
        dashboardId,
        widget: {
          title: title.trim(),
          source,
          metricName: source === 'METRIC' ? metricName : undefined,
          filterName:
            source === 'TRANSACTIONS' && filterName !== ALL_TRANSACTIONS ? filterName : undefined,
          aggregation,
          display,
          groupBy: taggable && groupBy !== NONE ? groupBy : undefined,
          tagKey: taggable && tagKey !== NONE ? tagKey : undefined,
          tagValue: taggable && tagKey !== NONE ? tagValue.trim() : undefined,
        },
      },
      {
        onSuccess: () => close(false),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className={`max-h-[90dvh] overflow-y-auto ${step === 'gallery' ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        {step === 'gallery' ? (
          <div className="grid gap-5">
            <DialogHeader>
              <DialogTitle>Add a widget</DialogTitle>
              <DialogDescription>
                Pick a starting point. Cards show your own data when you have it, and an example
                when you do not yet.
              </DialogDescription>
            </DialogHeader>
            <WidgetGallery projectId={projectId} open={open} onSelect={choose} />
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (valid) submit();
            }}
            className="grid gap-5"
          >
            <DialogHeader>
              <DialogTitle>Set up your widget</DialogTitle>
              <DialogDescription>Adjust what to chart and how to summarize it.</DialogDescription>
            </DialogHeader>
            <FieldRow label="Title" htmlFor="widget-title">
              <Input
                id="widget-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                placeholder="Cart value"
                autoFocus
              />
            </FieldRow>
            <FieldRow label="Data" htmlFor="widget-source">
              <Select value={source} onValueChange={(value) => changeSource(value as SeriesSource)}>
                <SelectTrigger id="widget-source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="METRIC">Custom metric</SelectItem>
                  <SelectItem value="TRANSACTIONS">Transaction duration</SelectItem>
                  <SelectItem value="ERRORS">Errors</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            {source === 'METRIC' && (
              <FieldRow
                label="Metric"
                htmlFor="widget-metric"
                hint={
                  metrics?.length === 0
                    ? 'No metrics received yet. Send one with watchdog.gauge().'
                    : undefined
                }
              >
                <Select
                  value={metricName}
                  onValueChange={(value) => {
                    setMetricName(value);
                    resetTags();
                  }}
                >
                  <SelectTrigger id="widget-metric" className="w-full">
                    <SelectValue placeholder="Choose a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics?.map((metric) => (
                      <SelectItem key={metric.name} value={metric.name}>
                        {metric.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}
            {source === 'TRANSACTIONS' && (
              <FieldRow label="Transaction" htmlFor="widget-transaction">
                <Select
                  value={filterName}
                  onValueChange={(value) => {
                    setFilterName(value);
                    resetTags();
                  }}
                >
                  <SelectTrigger id="widget-transaction" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TRANSACTIONS}>All transactions</SelectItem>
                    {transactions?.map((row) => (
                      <SelectItem key={row.name} value={row.name}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldRow label="Summarize as" htmlFor="widget-aggregation">
                <Select
                  value={aggregation}
                  onValueChange={(value) => setAggregation(value as Aggregation)}
                >
                  <SelectTrigger id="widget-aggregation" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aggregationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Show as" htmlFor="widget-display">
                <Select
                  value={display}
                  onValueChange={(value) => setDisplay(value as WidgetDisplay)}
                >
                  <SelectTrigger id="widget-display" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPLAY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>
            {taggable && (
              <>
                <FieldRow
                  label="Split by tag"
                  htmlFor="widget-group"
                  hint="One line per tag value, such as tier or language."
                >
                  <Select value={groupBy} onValueChange={setGroupBy}>
                    <SelectTrigger id="widget-group" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No split</SelectItem>
                      {tagKeys?.map((entry) => (
                        <SelectItem key={entry.key} value={entry.key}>
                          {entry.key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FieldRow label="Only where tag" htmlFor="widget-tag">
                    <Select
                      value={tagKey}
                      onValueChange={(value) => {
                        setTagKey(value);
                        setTagValue('');
                      }}
                    >
                      <SelectTrigger id="widget-tag" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Any</SelectItem>
                        {tagKeys?.map((entry) => (
                          <SelectItem key={entry.key} value={entry.key}>
                            {entry.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  {tagKey !== NONE && (
                    <FieldRow label="Equals" htmlFor="widget-tag-value">
                      <Input
                        id="widget-tag-value"
                        value={tagValue}
                        onChange={(event) => setTagValue(event.target.value)}
                        list="widget-tag-values"
                        maxLength={200}
                      />
                      <datalist id="widget-tag-values">
                        {filterValues.map((value) => (
                          <option key={value} value={value} />
                        ))}
                      </datalist>
                    </FieldRow>
                  )}
                </div>
              </>
            )}
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('gallery')}>
                <ArrowLeft className="size-4" />
                Back to cards
              </Button>
              <Button type="submit" disabled={!valid || addWidget.isPending}>
                {addWidget.isPending && <Loader2 className="size-4 animate-spin" />}
                Add widget
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
