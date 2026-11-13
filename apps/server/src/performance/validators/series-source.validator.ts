import { BadRequestException } from '@nestjs/common';
import { ERROR_AGGREGATIONS } from '../constants/performance.constants';
import type { Aggregation, SeriesSource } from '../interfaces/performance.interfaces';

interface SeriesChoice {
  source: SeriesSource;
  aggregation: Aggregation;
  groupBy?: string;
  tagKey?: string;
}

export class SeriesSourceValidator {
  static assertSupported({ source, aggregation, groupBy, tagKey }: SeriesChoice): void {
    if (source !== 'ERRORS') {
      return;
    }
    if (!(ERROR_AGGREGATIONS as readonly string[]).includes(aggregation)) {
      throw new BadRequestException('Errors can be counted or shown as a rate per second');
    }
    if (groupBy || tagKey) {
      throw new BadRequestException('Errors cannot be split or filtered by tag');
    }
  }
}
