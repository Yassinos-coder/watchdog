const STORAGE_KEY = 'watchdog:update-dismissed';

export class UpdateUtils {
  static isDismissed(version: string): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === version;
    } catch {
      return false;
    }
  }

  static dismiss(version: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, version);
    } catch {
      return;
    }
  }
}
