import { MAX_TITLE_LENGTH } from '../constants/ingest.constants';
import { IngestEvent, IngestFrame } from '../interfaces/ingest.interfaces';

export class EventSummaryMapper {
  static toTitle(event: IngestEvent): string {
    const firstLine = event.message.split('\n')[0];
    return firstLine.slice(0, MAX_TITLE_LENGTH);
  }

  static toCulprit(event: IngestEvent): string | null {
    const frames = event.exception?.frames ?? [];
    const newestFirst = [...frames].reverse();
    const frame = newestFirst.find((candidate) => candidate.inApp === true) ?? newestFirst[0];
    return frame ? EventSummaryMapper.describeFrame(frame) : null;
  }

  private static describeFrame(frame: IngestFrame): string {
    const location = [frame.filename, frame.lineno].filter((part) => part !== undefined).join(':');
    const label = frame.function ?? '<anonymous>';
    return location ? `${label} (${location})` : label;
  }
}
