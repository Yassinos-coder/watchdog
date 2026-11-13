import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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

const PALETTE_SIZE = 5;

export function SeriesChart({
  series,
  range,
  aggregation,
  isDuration,
  kind,
  height = 'h-56',
}: SeriesChartProps) {
  const { rows, lines } = PerformanceUtils.toChartData(series);
  const grouped = lines.length > 1 || Boolean(series.groups);
  const short = range === '1h' || range === '24h';
  const formatTick = (value: string): string =>
    short ? Format.hour(value) : Format.shortDate(value);
  const formatValue = (value: number): string =>
    PerformanceUtils.value(value, isDuration, aggregation);
  const config: ChartConfig = Object.fromEntries(
    lines.map((line, index) => [
      line.id,
      { label: line.label, color: `var(--chart-${(index % PALETTE_SIZE) + 1})` },
    ]),
  );

  if (rows.length === 0) {
    return (
      <div
        className={`grid ${height} place-items-center rounded-lg border border-dashed text-sm text-muted-foreground`}
      >
        No data in this range yet.
      </div>
    );
  }

  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="timestamp"
        tickLine={false}
        axisLine={false}
        minTickGap={32}
        tickFormatter={formatTick}
      />
      <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={formatValue} />
      <ChartTooltip
        content={
          <ChartTooltipContent
            labelFormatter={(value) => Format.dateTime(String(value))}
            formatter={(value, name) => (
              <span className="flex w-full items-center justify-between gap-3">
                {grouped && (
                  <span className="text-muted-foreground">
                    {config[String(name)]?.label ?? name}
                  </span>
                )}
                <span className="tabular font-medium">{formatValue(Number(value))}</span>
              </span>
            )}
          />
        }
      />
      {grouped && <ChartLegend content={<ChartLegendContent />} />}
    </>
  );

  return (
    <ChartContainer config={config} className={`aspect-auto ${height} w-full`}>
      {kind === 'BAR' ? (
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
          {axes}
          {lines.map((line, index) => (
            <Bar
              key={line.id}
              dataKey={line.id}
              stackId="series"
              fill={`var(--color-${line.id})`}
              radius={index === lines.length - 1 ? [3, 3, 0, 0] : 0}
            />
          ))}
        </BarChart>
      ) : (
        <AreaChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
          {axes}
          {lines.map((line) => (
            <Area
              key={line.id}
              dataKey={line.id}
              type="monotone"
              stroke={`var(--color-${line.id})`}
              strokeWidth={2}
              fill={`var(--color-${line.id})`}
              fillOpacity={grouped ? 0.06 : 0.12}
              connectNulls
            />
          ))}
        </AreaChart>
      )}
    </ChartContainer>
  );
}
