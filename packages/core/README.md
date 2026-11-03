# @watchdog-sdk/core

The shared foundation of the Watchdog SDKs: the event model, stack trace parsing, breadcrumbs and a delivery queue with retries. Most apps want [`@watchdog-sdk/browser`](https://www.npmjs.com/package/@watchdog-sdk/browser), [`@watchdog-sdk/react`](https://www.npmjs.com/package/@watchdog-sdk/react) or [`@watchdog-sdk/node`](https://www.npmjs.com/package/@watchdog-sdk/node) instead. Use this package to build an integration for another runtime.

```bash
bun add @watchdog-sdk/core
```

```ts
import { WatchdogClient } from '@watchdog-sdk/core';

const client = new WatchdogClient(
  { dsn: 'https://<key>@your-watchdog-host/<project-id>', release: '1.0.0' },
  { name: 'my-integration', version: '1.0.0' },
);

client.captureException(new Error('Something broke'));
await client.flush();
```

Watchdog is an open source, self-hosted error tracker. Documentation and server: https://github.com/Yassinos-coder/watchdog
