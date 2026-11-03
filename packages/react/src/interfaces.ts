import type { ReactNode } from 'react';

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

export interface ReactRootErrorInfo {
  componentStack?: string;
}
