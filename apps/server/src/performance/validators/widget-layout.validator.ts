import { BadRequestException } from '@nestjs/common';
import { DASHBOARD_COLUMNS } from '../constants/performance.constants';
import type { WidgetLayoutUpdate } from '../interfaces/performance.interfaces';

export class WidgetLayoutValidator {
  static assertFits(items: WidgetLayoutUpdate[], widgetIds: string[]): void {
    const known = new Set(widgetIds);
    const seen = new Set<string>();
    for (const item of items) {
      if (!known.has(item.id) || seen.has(item.id)) {
        throw new BadRequestException('The layout includes a widget that is not on this dashboard');
      }
      seen.add(item.id);
      if (item.x + item.w > DASHBOARD_COLUMNS) {
        throw new BadRequestException('A widget cannot extend past the right edge of the dashboard');
      }
    }
  }
}
