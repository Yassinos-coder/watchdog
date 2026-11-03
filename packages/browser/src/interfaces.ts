import type { WatchdogOptions } from '@watchdog-sdk/core';

export interface BrowserIntegrations {
  globalHandlers?: boolean;
  console?: boolean;
  clicks?: boolean;
  navigation?: boolean;
  network?: boolean;
}

export interface BrowserOptions extends WatchdogOptions {
  integrations?: BrowserIntegrations;
}

export type Uninstall = () => void;
