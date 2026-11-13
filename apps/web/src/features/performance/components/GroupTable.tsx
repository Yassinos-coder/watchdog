import type { Aggregation, SeriesGroup } from '../types/performance.types';
import { PerformanceUtils } from '../utils/performance.utils';

interface GroupTableProps {
  groups: SeriesGroup[];
  groupLabel: string;
  aggregation: Aggregation;
  isDuration: boolean;
}

export function GroupTable({ groups, groupLabel, aggregation, isDuration }: GroupTableProps) {
  if (groups.length === 0) {
    return (
      <div className="grid h-44 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No data in this range yet.
      </div>
    );
  }

  return (
    <div className="max-h-44 overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{groupLabel}</th>
            <th className="px-3 py-2 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {groups.map((group) => (
            <tr key={group.key}>
              <td className="max-w-0 truncate px-3 py-1.5 font-mono">{group.key}</td>
              <td className="tabular px-3 py-1.5 text-right font-medium">
                {PerformanceUtils.value(group.total, isDuration, aggregation)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
