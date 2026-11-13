# Data retention

Watchdog deletes old data on its own, every six hours, starting a minute after the server boots. Set a value of `0` to keep that kind of data forever.

| Variable | Default | Removes |
| --- | --- | --- |
| `RETENTION_EVENT_DAYS` | `90` | Error events, and issues not seen within the period |
| `RETENTION_PERFORMANCE_DAYS` | `30` | Transactions and raw metric points |
| `RETENTION_ROLLUP_DAYS` | `400` | Hourly metric summaries, which feed the 7, 30 and 90 day dashboard ranges |
| `RETENTION_REPLAY_DAYS` | `30` | Session replays |

Raw metric points are summarized into hourly rollups before they are deleted, so metric charts keep their history for `RETENTION_ROLLUP_DAYS` even after the raw points are gone. Summaries only cover hours that were rolled up while the data still existed.

Deletion is permanent. Lower values keep your database small, which matters most for replays.
