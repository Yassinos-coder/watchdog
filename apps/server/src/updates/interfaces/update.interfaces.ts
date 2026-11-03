export interface UpdateStatus {
  checkEnabled: boolean;
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  changelogUrl: string;
}

export interface UpdatesConfig {
  enabled: boolean;
  currentVersion: string;
}
