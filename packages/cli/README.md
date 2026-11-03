# @watchdog-sdk/cli

Upload source maps to your Watchdog server from your build, so stack traces show your original files and code instead of minified bundles.

```bash
bun add -d @watchdog-sdk/cli
```

```bash
WATCHDOG_URL=https://your-watchdog-host \
WATCHDOG_PROJECT_ID=<project id> \
WATCHDOG_UPLOAD_TOKEN=<upload token from project settings> \
bunx watchdog sourcemaps upload ./dist --release 1.0.0
```

The `--release` value must match the `release` you pass to the SDK. Use `--dry-run` to list the files without uploading. Run `watchdog --help` for all options.

Watchdog is an open source, self-hosted error tracker. Documentation and server: https://github.com/Yassinos-coder/watchdog
