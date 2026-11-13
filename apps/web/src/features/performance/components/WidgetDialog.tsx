import { Loader2 } from 'lucide-react';
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
import { AGGREGATION_OPTIONS, DISPLAY_OPTIONS } from '../constants/performance.constants';
import { useAddWidget } from '../hooks/usePerformanceMutations';
import { useMetricNames, useTagKeys, useTransactionSummary } from '../hooks/usePerformanceQueries';
import type { Aggregation, SeriesSource, WidgetDisplay } from '../types/performance.types';

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
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<SeriesSource>('METRIC');
  const [metricName, setMetricName] = useState('');
  const [filterName, setFilterName] = useState(ALL_TRANSACTIONS);
  const [aggregation, setAggregation] = useState<Aggregation>('AVG');
  const [display, setDisplay] = useState<WidgetDisplay>('LINE');
  const [groupBy, setGroupBy] = useState(NONE);
  const [tagKey, setTagKey] = useState(NONE);
  const [tagValue, setTagValue] = useState('');
  const subject =
    source === 'METRIC' ? metricName : filterName === ALL_TRANSACTIONS ? undefined : filterName;
  const { data: tagKeys } = useTagKeys(
    projectId,
    source,
    subject || undefined,
    open && (source === 'TRANSACTIONS' || metricName.length > 0),
  );
  const filterValues = tagKeys?.find((entry) => entry.key === tagKey)?.values ?? [];

  const valid =
    title.trim().length > 0 &&
    (source === 'TRANSACTIONS' || metricName.length > 0) &&
    (tagKey === NONE || tagValue.trim().length > 0);

  const resetTags = (): void => {
    setGroupBy(NONE);
    setTagKey(NONE);
    setTagValue('');
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
          groupBy: groupBy === NONE ? undefined : groupBy,
          tagKey: tagKey === NONE ? undefined : tagKey,
          tagValue: tagKey === NONE ? undefined : tagValue.trim(),
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTitle('');
          setMetricName('');
          resetTags();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) submit();
          }}
          className="grid gap-5"
        >
          <DialogHeader>
            <DialogTitle>Add a widget</DialogTitle>
            <DialogDescription>Pick the data to chart and how to summarize it.</DialogDescription>
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
            <Select
              value={source}
              onValueChange={(value) => {
                setSource(value as SeriesSource);
                resetTags();
              }}
            >
              <SelectTrigger id="widget-source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="METRIC">Custom metric</SelectItem>
                <SelectItem value="TRANSACTIONS">Transaction duration</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          {source === 'METRIC' ? (
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
          ) : (
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
                  {AGGREGATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Show as" htmlFor="widget-display">
              <Select value={display} onValueChange={(value) => setDisplay(value as WidgetDisplay)}>
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
          <DialogFooter>
            <Button type="submit" disabled={!valid || addWidget.isPending}>
              {addWidget.isPending && <Loader2 className="size-4 animate-spin" />}
              Add widget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
