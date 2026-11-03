# @watchdog-sdk/react-native

Watchdog for React Native and Expo: uncaught JavaScript errors, unhandled promise rejections, breadcrumbs, an error boundary, tracing and custom metrics.

```bash
npx expo install @watchdog-sdk/react-native
# or
bun add @watchdog-sdk/react-native
```

```tsx
import * as Watchdog from '@watchdog-sdk/react-native';

Watchdog.init({
  dsn: 'https://<key>@your-watchdog-host/<project-id>',
  release: '1.0.0',
  environment: __DEV__ ? 'development' : 'production',
});

export default function App() {
  return (
    <Watchdog.WatchdogErrorBoundary fallback={({ reset }) => <Fallback onRetry={reset} />}>
      <Root />
    </Watchdog.WatchdogErrorBoundary>
  );
}
```

Call `init` once, as early as possible (the top of your entry file, before the app component renders).

## What is captured

- Uncaught JavaScript errors, with fatal ones flushed before the app closes.
- Unhandled promise rejections (Hermes, the default engine for current React Native and Expo).
- Breadcrumbs for `console`, `fetch` requests (URLs are stripped of query strings) and app foreground/background changes.
- OS name and version, and the JS engine, on every event.

Native crashes (a Java, Kotlin, Swift or C++ crash outside JavaScript) are not captured. This package is JavaScript only and works in Expo Go and managed Expo apps with no config plugin.

## Navigation breadcrumbs

With React Navigation:

```tsx
const navigationRef = useNavigationContainerRef();
const onStateChange = useMemo(() => Watchdog.navigationBreadcrumbs(navigationRef), [navigationRef]);

<NavigationContainer ref={navigationRef} onStateChange={onStateChange}>
```

With Expo Router, call `Watchdog.addBreadcrumb({ category: 'navigation', message: pathname })` from an effect on `usePathname()`.

## Users, tags, tracing, metrics

```ts
Watchdog.setUser({ id: '42' });
Watchdog.setTag('plan', 'pro');

const transaction = Watchdog.startTransaction({ name: 'load-feed', op: 'ui.load' });
transaction?.startSpan('http', 'GET /feed').finish();
transaction?.finish();

Watchdog.increment('checkout.completed');
```

## Readable stack traces

Hermes builds are minified. Upload the source map for each release so Watchdog can show your original code. The stack frames name the bundle (`index.android.bundle`, `main.jsbundle`), so upload each source map under that name for the same `release` you pass to `init`. See the [source maps guide](https://github.com/Yassinos-coder/watchdog/blob/main/docs/source-maps.md).

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `release`, `environment` | none | Group and filter events |
| `sampleRate` | `1` | Share of errors to send |
| `tracesSampleRate` | `1` | Share of transactions to send |
| `integrations` | all on | Turn off `globalHandlers`, `unhandledRejections`, `console`, `network` or `appState` |
| `flushTimeoutMs` | `2000` | How long to wait to send a fatal error before the app closes |
| `beforeSend` | none | Edit or drop an event |

Watchdog is an open source, self-hosted error tracker. Documentation and server: https://github.com/Yassinos-coder/watchdog
