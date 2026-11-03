import type { WatchdogOptions } from '@watchdog-sdk/core';
import type { ReactNode } from 'react';

export interface NativeIntegrations {
  globalHandlers?: boolean;
  unhandledRejections?: boolean;
  console?: boolean;
  network?: boolean;
  appState?: boolean;
}

export interface NativeOptions extends WatchdogOptions {
  integrations?: NativeIntegrations;
  flushTimeoutMs?: number;
}

export type Uninstall = () => void;

export interface FallbackProps {
  error: Error;
  reset: () => void;
}

export type FallbackRender = (props: FallbackProps) => ReactNode;

export interface WatchdogErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode | FallbackRender;
  onError?: (error: Error, componentStack: string) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
  tags?: Record<string, string>;
}

export interface WatchdogErrorBoundaryState {
  error: Error | null;
}

export interface NavigationRefLike {
  getCurrentRoute(): { name: string } | undefined;
}
