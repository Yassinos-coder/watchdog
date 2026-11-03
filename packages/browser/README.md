# @watchdog-sdk/browser

Report errors from the browser to your own Watchdog server. It captures uncaught errors and unhandled promise rejections, and records breadcrumbs for clicks, navigation, console output and network calls.

```bash
bun add @watchdog-sdk/browser
```

```ts
import * as Watchdog from '@watchdog-sdk/browser';

Watchdog.init({
  dsn: 'https://<key>@your-watchdog-host/<project-id>',
  release: '1.0.0',
  environment: 'production',
});

Watchdog.captureException(new Error('Test error from the browser'));
```

Upload source maps with [`@watchdog-sdk/cli`](https://www.npmjs.com/package/@watchdog-sdk/cli) so stack traces show your original code.

Watchdog is an open source, self-hosted error tracker. Documentation and server: https://github.com/Yassinos-coder/watchdog
