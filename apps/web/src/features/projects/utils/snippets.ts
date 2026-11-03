export interface SetupSnippets {
  react: string;
  browser: string;
  node: string;
  nestjs: string;
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
      sourceMaps: `bun add -d @watchdog-sdk/cli

# after your production build
WATCHDOG_URL=${serverUrl} \\
WATCHDOG_PROJECT_ID=${projectId} \\
WATCHDOG_UPLOAD_TOKEN=<your upload token> \\
bunx watchdog sourcemaps upload ./dist --release 1.0.0`,
    };
  }

  static defaultTab(platform: string): keyof SetupSnippets {
    const map: Record<string, keyof SetupSnippets> = {
      react: 'react',
      javascript: 'browser',
      node: 'node',
      nestjs: 'nestjs',
    };
    return map[platform] ?? 'browser';
  }
}
