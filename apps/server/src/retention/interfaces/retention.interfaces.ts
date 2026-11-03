export interface RetentionPolicy {
  eventDays: number;
  performanceDays: number;
  replayDays: number;
}

export interface RetentionResult {
  issues: number;
  events: number;
  transactions: number;
  metrics: number;
  replays: number;
}
