import { formatDistanceToNowStrict, format } from 'date-fns';

export class Format {
  static relativeTime(value: string | Date): string {
    return `${formatDistanceToNowStrict(new Date(value))} ago`;
  }

  static timeUntil(value: string | Date): string {
    return `in ${formatDistanceToNowStrict(new Date(value))}`;
  }

  static dateTime(value: string | Date): string {
    return format(new Date(value), 'MMM d, yyyy HH:mm:ss');
  }

  static shortDate(value: string | Date): string {
    return format(new Date(value), 'MMM d');
  }

  static hour(value: string | Date): string {
    return format(new Date(value), 'HH:mm');
  }

  static number(value: number): string {
    return new Intl.NumberFormat('en', { notation: value >= 10_000 ? 'compact' : 'standard' }).format(value);
  }
}
