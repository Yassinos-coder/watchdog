# Data retention

Watchdog deletes old data on its own, every six hours, starting a minute after the server boots. Set a value of `0` to keep that kind of data forever.

| Variable | Default | Removes |
| --- | --- | --- |
| `RETENTION_EVENT_DAYS` | `90` | Error events, and issues not seen within the period |
| `RETENTION_PERFORMANCE_DAYS` | `30` | Transactions and metrics |
| `RETENTION_REPLAY_DAYS` | `30` | Session replays |

Deletion is permanent. Lower values keep your database small, which matters most for replays.
