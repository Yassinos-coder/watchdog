import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Format } from '@/lib/format';
import type { Aggregation, PerfRange, Series } from '../types/performance.types';
import { PerformanceUtils } from '../utils/performance.utils';

interface SeriesChartProps {
  series: Series;
  range: PerfRange;
  aggregation: Aggregation;
  isDuration: boolean;
  kind: 'LINE' | 'BAR';
  height?: string;
}

const CONFIG = { value: { label: 'Value', color: 'var(--chart-1)' } } satisfies ChartConfig;

export function SeriesChart({ series, range, aggregation, isDuration, kind, height = 'h-56' }: SeriesChartProps) {
  const data = series.points.map((point) => ({ timestamp: point.timestamp, value: point.value }));
  const short = range === '1h' || range === '24h';
  const formatTick = (value: string): string => (short ? Format.hour(value) : Format.shortDate(value));
  const formatValue = (value: number): string => PerformanceUtils.value(value, isDuration, aggregation);

  if (data.length === 0) {
    return (
      <div className={`grid ${height} place-items-center rounded-lg border border-dashed text-sm text-muted-foreground`}>
        No data in this range yet.
      </div>
    );
  }

  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="timestamp" tickLine={false} axisLine={false} minTickGap={32} tickFormatter={formatTick} />
      <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={formatValue} />
      <ChartTooltip
        content={
          <ChartTooltipContent
            labelFormatter={(value) => Format.dateTime(String(value))}
            formatter={(value) => <span className="tabular font-medium">{formatValue(Number(value))}</span>}
          />
        }
      />
    </>
  );

  return (
    <ChartContainer config={CONFIG} className={`aspect-auto ${height} w-full`}>
      {kind === 'BAR' ? (
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          {axes}
          <Bar dataKey="value" fill="var(--color-value)" radius={[3, 3, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          {axes}
          <Area dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} fill="var(--color-value)" fillOpacity={0.12} connectNulls />
        </AreaChart>
      )}
    </ChartContainer>
  );
}
