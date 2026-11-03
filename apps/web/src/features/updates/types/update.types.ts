export interface UpdateStatus {
  checkEnabled: boolean;
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  changelogUrl: string;
}
