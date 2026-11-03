import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { WatchdogErrorBoundaryProps, WatchdogErrorBoundaryState } from './interfaces';
import { captureException } from './native-sdk';

const initialState: WatchdogErrorBoundaryState = { error: null };

export class WatchdogErrorBoundary extends Component<
  WatchdogErrorBoundaryProps,
  WatchdogErrorBoundaryState
> {
  state = initialState;

  static getDerivedStateFromError(error: unknown): WatchdogErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const componentStack = info.componentStack ?? '';
    captureException(error, {
      handled: true,
      tags: { mechanism: 'react.errorBoundary', ...this.props.tags },
      extra: { componentStack },
    });
    this.props.onError?.(error, componentStack);
  }

  componentDidUpdate(previous: WatchdogErrorBoundaryProps): void {
    if (this.state.error && this.keysChanged(previous.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }
    const { fallback } = this.props;
    if (typeof fallback === 'function') {
      return fallback({ error, reset: this.reset });
    }
    return fallback ?? null;
  }

  private reset = (): void => {
    this.props.onReset?.();
    this.setState(initialState);
  };

  private keysChanged(previous: unknown[] = [], next: unknown[] = []): boolean {
    return (
      previous.length !== next.length || previous.some((value, index) => !Object.is(value, next[index]))
    );
  }
}
