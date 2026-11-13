export interface RetentionPolicy {
  eventDays: number;
  performanceDays: number;
  replayDays: number;
  rollupDays: number;
}

export interface RetentionResult {
  issues: number;
  events: number;
  transactions: number;
  metrics: number;
  rollups: number;
  replays: number;
}
