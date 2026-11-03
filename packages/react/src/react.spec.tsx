import { close, init } from '@watchdog-sdk/browser';
import type { Transport, WatchdogEvent } from '@watchdog-sdk/core';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactRootErrorHandlers, useWatchdog, WatchdogErrorBoundary, withErrorBoundary } from './index';

const DSN = 'https://key123@watchdog.example.com/3f2b8c1a-1111-4222-8333-444455556666';

class MemoryTransport implements Transport {
  events: WatchdogEvent[] = [];
  send(event: WatchdogEvent): void {
    this.events.push(event);
  }
  async flush(): Promise<boolean> {
    return true;
  }
}

function Bomb({ explode }: { explode: boolean }) {
  if (explode) {
    throw new TypeError('render exploded');
  }
  return <p>all good</p>;
}

let transport: MemoryTransport;

beforeEach(() => {
  transport = new MemoryTransport();
  init({ dsn: DSN, transport, integrations: { globalHandlers: false, console: false } });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  close();
  vi.restoreAllMocks();
});

describe('WatchdogErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <WatchdogErrorBoundary fallback={<p>oops</p>}>
        <Bomb explode={false} />
      </WatchdogErrorBoundary>,
    );

    expect(screen.getByText('all good')).toBeTruthy();
    expect(transport.events).toHaveLength(0);
  });

  it('shows the fallback and reports the error with its component stack', () => {
    const onError = vi.fn();

    render(
      <WatchdogErrorBoundary fallback={<p>oops</p>} onError={onError} tags={{ area: 'checkout' }}>
        <Bomb explode />
      </WatchdogErrorBoundary>,
    );

    expect(screen.getByText('oops')).toBeTruthy();
    expect(transport.events).toHaveLength(1);
    expect(transport.events[0].exception).toMatchObject({ type: 'TypeError', value: 'render exploded' });
    expect(transport.events[0].tags).toMatchObject({ mechanism: 'react.errorBoundary', area: 'checkout' });
    expect(String(transport.events[0].extra.componentStack)).toContain('Bomb');
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError), expect.stringContaining('Bomb'));
  });

  it('supports a render-prop fallback that can reset', () => {
    function Harness() {
      const [explode, setExplode] = useState(true);
      return (
        <WatchdogErrorBoundary
          fallback={({ error, reset }) => (
            <button
              onClick={() => {
                setExplode(false);
                reset();
              }}
            >
              retry after {error.message}
            </button>
          )}
        >
          <Bomb explode={explode} />
        </WatchdogErrorBoundary>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByText('retry after render exploded'));

    expect(screen.getByText('all good')).toBeTruthy();
  });

  it('resets automatically when resetKeys change', () => {
    const { rerender } = render(
      <WatchdogErrorBoundary fallback={<p>oops</p>} resetKeys={['a']}>
        <Bomb explode />
      </WatchdogErrorBoundary>,
    );
    expect(screen.getByText('oops')).toBeTruthy();

    rerender(
      <WatchdogErrorBoundary fallback={<p>oops</p>} resetKeys={['b']}>
        <Bomb explode={false} />
      </WatchdogErrorBoundary>,
    );

    expect(screen.getByText('all good')).toBeTruthy();
  });
});

describe('helpers', () => {
  it('wraps components with an error boundary', () => {
    const Safe = withErrorBoundary(Bomb, { fallback: <p>wrapped fallback</p> });

    render(<Safe explode />);

    expect(screen.getByText('wrapped fallback')).toBeTruthy();
    expect(transport.events).toHaveLength(1);
  });

  it('exposes the capture api through useWatchdog', () => {
    let api: ReturnType<typeof useWatchdog> | undefined;
    function Probe() {
      api = useWatchdog();
      return null;
    }
    render(<Probe />);

    act(() => {
      api!.captureMessage('from hook', 'warning');
    });

    expect(transport.events[0]).toMatchObject({ message: 'from hook', level: 'warning' });
  });

  it('reports React 19 root errors with the right mechanism and handled flag', () => {
    const handlers = reactRootErrorHandlers();

    handlers.onUncaughtError(new Error('uncaught'), { componentStack: '\n at App' });
    handlers.onCaughtError(new Error('caught'), {});
    handlers.onRecoverableError(new Error('recoverable'), {});

    expect(transport.events.map((event) => [event.tags.mechanism, event.exception?.handled])).toEqual([
      ['react.uncaught', false],
      ['react.caught', true],
      ['react.recoverable', true],
    ]);
    expect(transport.events[2].level).toBe('warning');
  });
});
