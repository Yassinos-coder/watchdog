export interface InstanceView {
  version: string;
  appUrl: string;
  appUrlExplicit: boolean;
  updateChecks: boolean;
  retention: {
    eventDays: number;
    performanceDays: number;
    rollupDays: number;
    replayDays: number;
  };
  signIn: {
    google: boolean;
    github: boolean;
  };
}
