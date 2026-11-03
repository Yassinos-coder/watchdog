import type { WatchdogOptions } from '@watchdog-sdk/core';

export interface BrowserIntegrations {
  globalHandlers?: boolean;
  console?: boolean;
  clicks?: boolean;
  navigation?: boolean;
  network?: boolean;
}

export interface ReplayOptions {
  sampleRate?: number;
  maskAllInputs?: boolean;
  maskAllText?: boolean;
  flushIntervalMs?: number;
}

export interface BrowserOptions extends WatchdogOptions {
  integrations?: BrowserIntegrations;
  replay?: ReplayOptions;
}

export type Uninstall = () => void;
