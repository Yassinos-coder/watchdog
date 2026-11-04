export interface SetupSnippets {
  react: string;
  browser: string;
  node: string;
  nestjs: string;
  python: string;
  reactNative: string;
  sourceMaps: string;
}

export class SnippetBuilder {
  static build(dsn: string, projectId: string, serverUrl: string): SetupSnippets {
    return {
      react: `bun add @watchdog-sdk/react

// main.tsx
import { createRoot } from 'react-dom/client';
import * as Watchdog from '@watchdog-sdk/react';

Watchdog.init({
  dsn: '${dsn}',
  release: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById('root')!, Watchdog.reactRootErrorHandlers()).render(
  <Watchdog.WatchdogErrorBoundary fallback={<p>Something went wrong.</p>}>
    <App />
  </Watchdog.WatchdogErrorBoundary>,
);`,
      browser: `bun add @watchdog-sdk/browser

import * as Watchdog from '@watchdog-sdk/browser';

Watchdog.init({
  dsn: '${dsn}',
  release: '1.0.0',
  environment: 'production',
});

Watchdog.captureException(new Error('Test error from the browser'));`,
      node: `bun add @watchdog-sdk/node

import * as Watchdog from '@watchdog-sdk/node';

Watchdog.init({
  dsn: '${dsn}',
  release: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
});

// Express
app.use(Watchdog.expressErrorHandler());`,
      nestjs: `bun add @watchdog-sdk/node

// main.ts
import * as Watchdog from '@watchdog-sdk/node';
Watchdog.init({ dsn: '${dsn}', release: process.env.APP_VERSION });

// app.module.ts
import { APP_FILTER } from '@nestjs/core';
import { WatchdogExceptionFilter } from '@watchdog-sdk/node/nest';

@Module({
  providers: [{ provide: APP_FILTER, useClass: WatchdogExceptionFilter }],
})
export class AppModule {}`,
      python: `pip install watchdog-sdk   # or: uv add watchdog-sdk

import watchdog_sdk as watchdog

watchdog.init(
    dsn='${dsn}',
    release='1.0.0',
    environment='production',
)

# Unhandled exceptions and logger.error(...) are reported automatically.
# Optional: time a unit of work and count things.
with watchdog.start_transaction('handle_job', op='job'):
    ...

watchdog.increment('jobs.completed')`,
      reactNative: `npx expo install @watchdog-sdk/react-native   # or: bun add @watchdog-sdk/react-native

import * as Watchdog from '@watchdog-sdk/react-native';

Watchdog.init({
  dsn: '${dsn}',
  release: '1.0.0',
  environment: __DEV__ ? 'development' : 'production',
});

// Wrap your app to catch render errors
<Watchdog.WatchdogErrorBoundary fallback={<Fallback />}>
  <App />
</Watchdog.WatchdogErrorBoundary>`,
      sourceMaps: `bun add -d @watchdog-sdk/cli

# after your production build
WATCHDOG_URL=${serverUrl} \\
WATCHDOG_PROJECT_ID=${projectId} \\
WATCHDOG_UPLOAD_TOKEN=<your upload token> \\
bunx @watchdog-sdk/cli sourcemaps upload ./dist --release 1.0.0`,
    };
  }

  static defaultTab(platform: string): keyof SetupSnippets {
    const map: Record<string, keyof SetupSnippets> = {
      react: 'react',
      javascript: 'browser',
      node: 'node',
      nestjs: 'nestjs',
      python: 'python',
      'react-native': 'reactNative',
    };
    return map[platform] ?? 'browser';
  }
}
