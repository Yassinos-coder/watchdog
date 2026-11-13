export interface InstanceRecord {
  instanceId: string;
  version: string;
  bootedAt: string;
  stoppedAt: string | null;
}

export interface ProjectActivity {
  name: string;
  lastSeen: Date | null;
}

export interface OnlineContext {
  version: string;
  previous: InstanceRecord | null;
  bootedAt: Date;
  projects: ProjectActivity[];
  appUrl: string;
  now: Date;
}
