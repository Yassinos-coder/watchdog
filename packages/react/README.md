# @watchdog-sdk/react

Watchdog for React: an error boundary, a hook, and handlers for React 19's root error callbacks. It re-exports everything from `@watchdog-sdk/browser`.

```bash
bun add @watchdog-sdk/react
```

```tsx
import { createRoot } from 'react-dom/client';
import * as Watchdog from '@watchdog-sdk/react';

Watchdog.init({ dsn: 'https://<key>@your-watchdog-host/<project-id>', release: '1.0.0' });

createRoot(document.getElementById('root')!, Watchdog.reactRootErrorHandlers()).render(
  <Watchdog.WatchdogErrorBoundary fallback={<p>Something went wrong.</p>}>
    <App />
  </Watchdog.WatchdogErrorBoundary>,
);
```

Works with React 18 and 19.

Watchdog is an open source, self-hosted error tracker. Documentation and server: https://github.com/Yassinos-coder/watchdog
