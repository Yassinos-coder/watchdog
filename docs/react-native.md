# React Native and Expo

`@watchdog-sdk/react-native` reports JavaScript crashes from mobile apps. It works in Expo Go and managed Expo apps without a config plugin, and in bare React Native 0.70 or newer.

```bash
npx expo install @watchdog-sdk/react-native
```

```tsx
import * as Watchdog from '@watchdog-sdk/react-native';

Watchdog.init({
  dsn: 'https://<key>@your-watchdog.example.com/<project-id>',
  release: '1.0.0',
  environment: __DEV__ ? 'development' : 'production',
});
```

Call `init` at the top of your entry file, before the app renders.

## What is captured

- Uncaught JavaScript errors. Fatal ones are sent before the app closes.
- Unhandled promise rejections on Hermes, the default engine.
- Breadcrumbs for `console`, `fetch` requests and app foreground/background changes.
- The OS name and version and the JS engine on every event.
- Everything the other SDKs offer: users, tags, [tracing and metrics](tracing-and-metrics.md).

Crashes in native code (Java, Kotlin, Swift, C++) are **not** captured, because this SDK runs in JavaScript.

## Error boundary and navigation

```tsx
<Watchdog.WatchdogErrorBoundary fallback={({ reset }) => <Fallback onRetry={reset} />}>
  <Root />
</Watchdog.WatchdogErrorBoundary>
```

With React Navigation, pass `Watchdog.navigationBreadcrumbs(navigationRef)` as `onStateChange` on the container to record screen changes.

## Readable stack traces

Release builds are minified. Upload the source map for each release under the bundle name that appears in the stack (`index.android.bundle` on Android, `main.jsbundle` on iOS), using the same `release` you pass to `init`. See [Source maps](source-maps.md).
