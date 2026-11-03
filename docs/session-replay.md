# Session replay

Replay records what a user saw and did in the browser, so you can watch the moments around an error.

## Turn it on

Install the recorder next to the browser SDK:

```bash
npm install @watchdog-sdk/browser @rrweb/record
```

```ts
import { init } from '@watchdog-sdk/browser';

init({
  dsn: '...',
  replay: { sampleRate: 0.1, maskAllInputs: true },
});
```

`@rrweb/record` is an optional peer dependency. If it is not installed, replay does nothing and nothing breaks.

| Option | Default | Meaning |
| --- | --- | --- |
| `sampleRate` | `0.1` | Share of sessions to record (0 to 1). Recording is the heaviest thing the SDK does, so the default is 10% |
| `maskAllInputs` | `true` | Hide what people type into fields |
| `maskAllText` | `false` | Hide all text on the page |
| `flushIntervalMs` | `5000` | How often recorded data is sent |

## Privacy

Add the class `wd-block` to an element to leave it out entirely, or `wd-mask` to hide its text. Passwords are always masked. Record only what you have a lawful reason to record, and tell your users.

## Watching replays

Open **Replays** in a project. Replays that include an error show a bug badge, and you can look one up from an event with `GET /api/projects/<id>/events/<event-id>/replay`.

Replays are deleted automatically after the [retention period](retention.md).
