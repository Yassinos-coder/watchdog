import { Area, AreaChart, Bar, BarChart } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

interface MiniChartProps {
  values: number[];
  kind: 'LINE' | 'BAR';
  muted?: boolean;
}

const CONFIG = { value: { label: 'Value', color: 'var(--chart-1)' } } satisfies ChartConfig;

export function MiniChart({ values, kind, muted = false }: MiniChartProps) {
  const data = values.map((value, index) => ({ index, value }));
  const margin = { top: 4, right: 0, bottom: 0, left: 0 };

  return (
    <ChartContainer
      config={CONFIG}
      className={`aspect-auto h-20 w-full ${muted ? 'opacity-50' : ''}`}
      aria-hidden="true"
    >
      {kind === 'BAR' ? (
        <BarChart data={data} margin={margin} barCategoryGap={2}>
          <Bar
            dataKey="value"
            fill="var(--color-value)"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      ) : (
        <AreaChart data={data} margin={margin}>
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            fill="var(--color-value)"
            fillOpacity={0.15}
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </ChartContainer>
  );
}
